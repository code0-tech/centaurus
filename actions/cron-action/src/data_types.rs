//! The five standard cron expression fields.

use hercules::JsonSchema;
use serde::{Deserialize, Serialize};

#[hercules::data_type(identifier = "CRON_MINUTE", name(en_US = "Cron Minute"))]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct CronMinute(
    #[schemars(regex(
        pattern = r"^(\*|([0-5]?\d)(-[0-5]?\d)?)(\/[0-5]?\d)?(,(\*|([0-5]?\d)(-[0-5]?\d)?)(\/[0-5]?\d)?)*$"
    ))]
    pub String,
);

#[hercules::data_type(identifier = "CRON_HOUR", name(en_US = "Cron Hour"))]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct CronHour(
    #[schemars(regex(
        pattern = r"^(\*|([01]?\d|2[0-3])(-([01]?\d|2[0-3]))?)(\/([01]?\d|2[0-3]))?(,(\*|([01]?\d|2[0-3])(-([01]?\d|2[0-3]))?)(\/([01]?\d|2[0-3]))?)*$"
    ))]
    pub String,
);

#[hercules::data_type(identifier = "CRON_DAY_OF_MONTH", name(en_US = "Cron Day of Month"))]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct CronDayOfMonth(
    #[schemars(regex(
        pattern = r"^(\*|([1-9]|[12]\d|3[01])(-([1-9]|[12]\d|3[01]))?)(\/([1-9]|[12]\d|3[01]))?(,(\*|([1-9]|[12]\d|3[01])(-([1-9]|[12]\d|3[01]))?)(\/([1-9]|[12]\d|3[01]))?)*$"
    ))]
    pub String,
);

#[hercules::data_type(identifier = "CRON_MONTH", name(en_US = "Cron Month"))]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct CronMonth(
    #[schemars(regex(
        pattern = r"^(\*|(0?[1-9]|1[0-2])(-(0?[1-9]|1[0-2]))?)(\/(0?[1-9]|1[0-2]))?(,(\*|(0?[1-9]|1[0-2])(-(0?[1-9]|1[0-2]))?)(\/(0?[1-9]|1[0-2]))?)*$"
    ))]
    pub String,
);

#[hercules::data_type(identifier = "CRON_DAY_OF_WEEK", name(en_US = "Cron Day of Week"))]
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(transparent)]
pub struct CronDayOfWeek(
    #[schemars(regex(pattern = r"^(\*|([0-7])(-([0-7]))?)(\/([0-7]))?(,(\*|([0-7])(-([0-7]))?)(\/([0-7]))?)*$"))]
    pub String,
);
