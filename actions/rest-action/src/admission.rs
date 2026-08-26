//! Bounded admission control for workflow execution: caps how many flow
//! executions this instance has in flight at once, independent of however
//! many HTTP connections/requests are open. Once saturated, new requests wait
//! for a bounded, configurable interval and then get a `503` with
//! `Retry-After` if no permit becomes available.

use std::sync::Arc;
use std::time::Duration;

use tokio::sync::{OwnedSemaphorePermit, Semaphore};

fn env(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

#[derive(Clone)]
pub struct Admission {
    semaphore: Arc<Semaphore>,
    wait_timeout: Duration,
    retry_after: Duration,
}

impl Admission {
    pub fn from_env() -> Self {
        let max_concurrent: usize = env("HERCULES_REST_MAX_CONCURRENT_EXECUTIONS", "256")
            .parse()
            .unwrap_or_else(|err| panic!("invalid HERCULES_REST_MAX_CONCURRENT_EXECUTIONS: {err}"));
        let wait_timeout_ms: u64 = env("HERCULES_REST_ADMISSION_WAIT_TIMEOUT_MS", "1000")
            .parse()
            .unwrap_or_else(|err| panic!("invalid HERCULES_REST_ADMISSION_WAIT_TIMEOUT_MS: {err}"));
        let retry_after_secs: u64 = env("HERCULES_REST_RETRY_AFTER_SECS", "1")
            .parse()
            .unwrap_or_else(|err| panic!("invalid HERCULES_REST_RETRY_AFTER_SECS: {err}"));

        Self::new(
            max_concurrent,
            Duration::from_millis(wait_timeout_ms),
            Duration::from_secs(retry_after_secs),
        )
    }

    pub fn new(max_concurrent: usize, wait_timeout: Duration, retry_after: Duration) -> Self {
        Self {
            semaphore: Arc::new(Semaphore::new(max_concurrent)),
            wait_timeout,
            retry_after,
        }
    }

    /// Waits up to the configured deadline for execution capacity. A zero
    /// timeout preserves fail-fast behavior.
    pub async fn acquire(&self) -> Option<OwnedSemaphorePermit> {
        if self.wait_timeout.is_zero() {
            return Arc::clone(&self.semaphore).try_acquire_owned().ok();
        }

        tokio::time::timeout(
            self.wait_timeout,
            Arc::clone(&self.semaphore).acquire_owned(),
        )
        .await
        .ok()
        .and_then(Result::ok)
    }

    pub fn retry_after_secs(&self) -> u64 {
        self.retry_after.as_secs()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn admits_up_to_the_configured_limit() {
        let admission = Admission::new(2, Duration::ZERO, Duration::from_secs(1));
        let first = admission.acquire().await;
        let second = admission.acquire().await;
        assert!(first.is_some());
        assert!(second.is_some());
        assert!(admission.acquire().await.is_none());
    }

    #[tokio::test]
    async fn releasing_a_permit_frees_capacity() {
        let admission = Admission::new(1, Duration::ZERO, Duration::from_secs(1));
        let permit = admission.acquire().await.expect("first acquire succeeds");
        assert!(admission.acquire().await.is_none());
        drop(permit);
        assert!(admission.acquire().await.is_some());
    }

    #[tokio::test]
    async fn waits_for_a_permit_to_be_released() {
        let admission = Admission::new(1, Duration::from_secs(1), Duration::from_secs(1));
        let permit = admission.acquire().await.expect("first acquire succeeds");
        let waiting = tokio::spawn({
            let admission = admission.clone();
            async move { admission.acquire().await }
        });

        tokio::task::yield_now().await;
        assert!(!waiting.is_finished());
        drop(permit);
        assert!(waiting.await.expect("waiter task panicked").is_some());
    }

    #[tokio::test(start_paused = true)]
    async fn returns_none_when_the_wait_timeout_expires() {
        let admission = Admission::new(1, Duration::from_millis(100), Duration::from_secs(1));
        let _permit = admission.acquire().await.expect("first acquire succeeds");
        let waiting = tokio::spawn({
            let admission = admission.clone();
            async move { admission.acquire().await }
        });

        tokio::task::yield_now().await;
        tokio::time::advance(Duration::from_millis(100)).await;
        assert!(waiting.await.expect("waiter task panicked").is_none());
    }
}
