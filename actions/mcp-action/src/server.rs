//! Serves the MCP tool server over Streamable HTTP, following rest-action's
//! plain hyper `TcpListener`/`http1::Builder` loop -- rmcp's
//! `StreamableHttpService` is a `tower::Service`, adapted onto hyper via
//! `TowerToHyperService`.

use std::net::SocketAddr;
use std::sync::Arc;

use hercules_sdk::Connected;
use hyper::server::conn::http1;
use hyper_util::rt::TokioIo;
use hyper_util::service::TowerToHyperService;
use rmcp::transport::streamable_http_server::session::local::LocalSessionManager;
use rmcp::transport::{StreamableHttpServerConfig, StreamableHttpService};
use tokio::net::TcpListener;

use crate::tools::FlowToolServer;

pub async fn serve(addr: SocketAddr, connected: Connected) -> std::io::Result<()> {
    let config = StreamableHttpServerConfig::default().disable_allowed_hosts();
    let service = StreamableHttpService::new(
        move || Ok(FlowToolServer::new(connected.clone())),
        Arc::new(LocalSessionManager::default()),
        config,
    );

    let listener = TcpListener::bind(addr).await?;
    log::info!("listening for MCP requests on {addr}");

    loop {
        let (stream, peer_addr) = listener.accept().await?;
        let io = TokioIo::new(stream);
        let svc = TowerToHyperService::new(service.clone());

        tokio::spawn(async move {
            if let Err(err) = http1::Builder::new().serve_connection(io, svc).await {
                log::debug!("connection from {peer_addr} closed with error: {err:?}");
            }
        });
    }
}
