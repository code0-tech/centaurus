//! The five standard cron expression fields.

use hercules::JsonSchema;
use serde::{Deserialize, Serialize};

#[hercules::data_type(
    identifier = "CRON_MINUTE",
    name(en_US = "Cron Minute"),
    display_message(en_US = "Cron Minute"),
    alias(en_US = "cron;code;schedule;timer;clock;minute")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct CronMinute(
    #[schemars(regex(
        pattern = r"^(\*|([0-5]?\d)(-[0-5]?\d)?)(\/[0-5]?\d)?(,(\*|([0-5]?\d)(-[0-5]?\d)?)(\/[0-5]?\d)?)*$"
    ))]
    pub String,
);

#[hercules::data_type(
    identifier = "CRON_HOUR",
    name(en_US = "Cron Hour"),
    display_message(en_US = "Cron Hour"),
    alias(en_US = "cron;code;schedule;timer;clock;hour")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct CronHour(
    #[schemars(regex(
        pattern = r"^(\*|([01]?\d|2[0-3])(-([01]?\d|2[0-3]))?)(\/([01]?\d|2[0-3]))?(,(\*|([01]?\d|2[0-3])(-([01]?\d|2[0-3]))?)(\/([01]?\d|2[0-3]))?)*$"
    ))]
    pub String,
);

#[hercules::data_type(
    identifier = "CRON_DAY_OF_MONTH",
    name(en_US = "Cron Day of Month"),
    display_message(en_US = "Cron Day of Month"),
    alias(en_US = "cron;code;schedule;timer;clock;month;day")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct CronDayOfMonth(
    #[schemars(regex(
        pattern = r"^(\*|([1-9]|[12]\d|3[01])(-([1-9]|[12]\d|3[01]))?)(\/([1-9]|[12]\d|3[01]))?(,(\*|([1-9]|[12]\d|3[01])(-([1-9]|[12]\d|3[01]))?)(\/([1-9]|[12]\d|3[01]))?)*$"
    ))]
    pub String,
);

#[hercules::data_type(
    identifier = "CRON_MONTH",
    name(en_US = "Cron Month"),
    display_message(en_US = "Cron Month"),
    alias(en_US = "cron;code;schedule;timer;clock;month")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct CronMonth(
    #[schemars(regex(
        pattern = r"^(\*|(0?[1-9]|1[0-2])(-(0?[1-9]|1[0-2]))?)(\/(0?[1-9]|1[0-2]))?(,(\*|(0?[1-9]|1[0-2])(-(0?[1-9]|1[0-2]))?)(\/(0?[1-9]|1[0-2]))?)*$"
    ))]
    pub String,
);

#[hercules::data_type(
    identifier = "CRON_DAY_OF_WEEK",
    name(en_US = "Cron Day of Week"),
    display_message(en_US = "Cron Day of Week"),
    alias(en_US = "cron;code;schedule;timer;clock;day;week")
)]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct CronDayOfWeek(
    #[schemars(regex(
        pattern = r"^(\*|([0-7])(-([0-7]))?)(\/([0-7]))?(,(\*|([0-7])(-([0-7]))?)(\/([0-7]))?)*$"
    ))]
    pub String,
);
