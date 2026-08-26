#[tokio::main]
async fn main() -> hercules_sdk::Result<()> {
    rest_action::run().await
}
