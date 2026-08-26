//! Bounded admission control for workflow execution: caps how many flow
//! executions this instance has in flight at once, independent of however
//! many HTTP connections/requests are open. Once saturated, new requests get
//! a `503` with `Retry-After` immediately — no flow input is built and no
//! execution is started.

use std::sync::Arc;
use std::time::Duration;

use tokio::sync::{OwnedSemaphorePermit, Semaphore};

fn env(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

#[derive(Clone)]
pub struct Admission {
    semaphore: Arc<Semaphore>,
    retry_after: Duration,
}

impl Admission {
    pub fn from_env() -> Self {
        let max_concurrent: usize = env("HERCULES_REST_MAX_CONCURRENT_EXECUTIONS", "256")
            .parse()
            .unwrap_or_else(|err| panic!("invalid HERCULES_REST_MAX_CONCURRENT_EXECUTIONS: {err}"));
        let retry_after_secs: u64 = env("HERCULES_REST_RETRY_AFTER_SECS", "1")
            .parse()
            .unwrap_or_else(|err| panic!("invalid HERCULES_REST_RETRY_AFTER_SECS: {err}"));

        Self::new(max_concurrent, Duration::from_secs(retry_after_secs))
    }

    pub fn new(max_concurrent: usize, retry_after: Duration) -> Self {
        Self {
            semaphore: Arc::new(Semaphore::new(max_concurrent)),
            retry_after,
        }
    }

    /// Non-blocking: `None` means the instance is at its configured
    /// concurrency limit right now.
    pub fn try_acquire(&self) -> Option<OwnedSemaphorePermit> {
        Arc::clone(&self.semaphore).try_acquire_owned().ok()
    }

    pub fn retry_after_secs(&self) -> u64 {
        self.retry_after.as_secs()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn admits_up_to_the_configured_limit() {
        let admission = Admission::new(2, Duration::from_secs(1));
        let first = admission.try_acquire();
        let second = admission.try_acquire();
        assert!(first.is_some());
        assert!(second.is_some());
        assert!(admission.try_acquire().is_none());
    }

    #[test]
    fn releasing_a_permit_frees_capacity() {
        let admission = Admission::new(1, Duration::from_secs(1));
        let permit = admission.try_acquire().expect("first acquire succeeds");
        assert!(admission.try_acquire().is_none());
        drop(permit);
        assert!(admission.try_acquire().is_some());
    }
}
