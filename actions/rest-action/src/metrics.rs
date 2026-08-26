//! Lightweight, always-on request counters. Per-request success/failure is
//! no longer logged at `info` (see `server.rs`, moved to `debug`) since that
//! scales badly with traffic; these atomics let `main.rs` log a periodic
//! aggregate at `info` instead, without adding any per-request allocation.

use std::sync::atomic::{AtomicU64, Ordering};

#[derive(Default)]
pub struct Metrics {
    total: AtomicU64,
    status_2xx: AtomicU64,
    status_4xx: AtomicU64,
    status_5xx: AtomicU64,
    overload_503: AtomicU64,
    oversized_413: AtomicU64,
}

#[derive(Debug, Clone, Copy)]
pub struct Snapshot {
    pub total: u64,
    pub status_2xx: u64,
    pub status_4xx: u64,
    pub status_5xx: u64,
    pub overload_503: u64,
    pub oversized_413: u64,
}

impl Metrics {
    pub fn record(&self, status: hyper::StatusCode) {
        self.total.fetch_add(1, Ordering::Relaxed);
        match status.as_u16() {
            200..=299 => {
                self.status_2xx.fetch_add(1, Ordering::Relaxed);
            }
            400..=499 => {
                self.status_4xx.fetch_add(1, Ordering::Relaxed);
            }
            500..=599 => {
                self.status_5xx.fetch_add(1, Ordering::Relaxed);
            }
            _ => {}
        }
        if status == hyper::StatusCode::SERVICE_UNAVAILABLE {
            self.overload_503.fetch_add(1, Ordering::Relaxed);
        }
        if status == hyper::StatusCode::PAYLOAD_TOO_LARGE {
            self.oversized_413.fetch_add(1, Ordering::Relaxed);
        }
    }

    pub fn snapshot(&self) -> Snapshot {
        Snapshot {
            total: self.total.load(Ordering::Relaxed),
            status_2xx: self.status_2xx.load(Ordering::Relaxed),
            status_4xx: self.status_4xx.load(Ordering::Relaxed),
            status_5xx: self.status_5xx.load(Ordering::Relaxed),
            overload_503: self.overload_503.load(Ordering::Relaxed),
            oversized_413: self.oversized_413.load(Ordering::Relaxed),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn records_status_class_and_specific_overload_counters() {
        let metrics = Metrics::default();
        metrics.record(hyper::StatusCode::OK);
        metrics.record(hyper::StatusCode::NOT_FOUND);
        metrics.record(hyper::StatusCode::SERVICE_UNAVAILABLE);
        metrics.record(hyper::StatusCode::PAYLOAD_TOO_LARGE);

        let snapshot = metrics.snapshot();
        assert_eq!(snapshot.total, 4);
        assert_eq!(snapshot.status_2xx, 1);
        assert_eq!(snapshot.status_4xx, 2);
        assert_eq!(snapshot.status_5xx, 1);
        assert_eq!(snapshot.overload_503, 1);
        assert_eq!(snapshot.oversized_413, 1);
    }
}
