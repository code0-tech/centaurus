//! The `CRON` flow trigger.
//!
//! Registering this `RuntimeEvent` is what lets users attach a flow to a
//! cron schedule in the platform UI; Aquila then pushes each such flow down
//! to this action as an `ActionFlow` with these five settings filled in per
//! flow.

#[hercules::runtime_event(
    identifier = "CRON",
    signature = "(cron_minute: CRON_MINUTE, cron_hour: CRON_HOUR, cron_day_of_month: CRON_DAY_OF_MONTH, cron_month: CRON_MONTH, cron_day_of_week: CRON_DAY_OF_WEEK): void",
    name(en_US = "Cron Job"),
    description(
        en_US = "A Cron Job is a scheduled task that runs automatically at specified intervals, typically defined using cron expressions. It is commonly used to automate repetitive operations such as data processing, system maintenance, and periodic updates without requiring manual execution."
    ),
    display_message(
        en_US = "Runs flow every ${cron_minute}min ${cron_hour}hour ${cron_day_of_month}day of month ${cron_month}month ${cron_day_of_week}day of week"
    ),
    alias(en_US = "cron;code;schedule;timer;clock;flow"),
    display_icon = "tabler:file-time"
)]
#[setting(
    identifier = "cron_minute",
    name(en_US = "Minute"),
    description(
        en_US = "Defines the minute when the flow runs (e.g., 0 for on the hour, */5 for every 5 minutes)."
    ),
    linked_data_type_identifiers("CRON_MINUTE")
)]
#[setting(
    identifier = "cron_hour",
    name(en_US = "Hour"),
    description(
        en_US = "Defines the hour when the flow runs (e.g., 0 for midnight, 14 for 2 PM)."
    ),
    linked_data_type_identifiers("CRON_HOUR")
)]
#[setting(
    identifier = "cron_day_of_month",
    name(en_US = "Day of the Month"),
    description(
        en_US = "Defines the day of the month when the flow runs (e.g., 1 for first day, 15 for mid-month)."
    ),
    linked_data_type_identifiers("CRON_DAY_OF_MONTH")
)]
#[setting(
    identifier = "cron_month",
    name(en_US = "Month"),
    description(
        en_US = "Defines the month when the flow runs (e.g., 1 for January, 12 for December)."
    ),
    linked_data_type_identifiers("CRON_MONTH")
)]
#[setting(
    identifier = "cron_day_of_week",
    name(en_US = "Day of the Week"),
    description(
        en_US = "Defines the weekday when the flow runs (e.g., 0 or SUN for Sunday, MON-FRI for weekdays)."
    ),
    linked_data_type_identifiers("CRON_DAY_OF_WEEK")
)]
pub struct CronRuntimeEvent;
