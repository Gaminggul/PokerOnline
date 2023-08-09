use futures::StreamExt;
use serde_json::Value;
use std::env;
use std::error::Error;
use std::time::Duration;
use tokio::sync::mpsc;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use url::Url;

#[tokio::main]
async fn main() {
    println!("Connecting to proxy...");
    connect().await;
}

async fn connect() {
    let url = env::var("PROXY_URL").expect("No proxy url found");
    let secret = env::var("PROXY_SECRET").expect("No proxy secret found");
    let path = "poker";

    let ws_url = format!("{}?secret={}&value={}&filter=contains", url, secret, path);

    loop {
        match connect_async(Url::parse(&ws_url).unwrap()).await {
            Ok((ws_stream, _)) => {
                println!("Connected!");
                let (_, read) = ws_stream.split();
                let (tx, mut rx) = mpsc::unbounded_channel();

                // Ping the server periodically
                let ping_tx = tx.clone();
                tokio::spawn(async move {
                    loop {
                        tokio::time::sleep(Duration::from_secs(10)).await;
                        if let Err(_) = ping_tx.send(Ok(Message::Ping(vec![]))) {
                            break;
                        }
                    }
                });

                // Receive messages from server
                tokio::spawn(async move {
                    read.for_each(|message| {
                        let tx = tx.clone();
                        async move {
                            if let Err(_) = tx.send(message) {
                                return;
                            }
                        }
                    })
                    .await;
                });

                // Process the received messages
                while let Some(Ok(msg)) = rx.recv().await {
                    match msg {
                        Message::Text(data) => match process_message(data).await {
                            Ok(_) => (),
                            Err(e) => eprintln!("Error processing message: {}", e),
                        },
                        Message::Close(_) => break,
                        _ => (),
                    }
                }
            }
            Err(e) => {
                eprintln!("Error connecting to WebSocket: {:?}", e);
            }
        }

        println!("Connection closed, reconnecting...");
        tokio::time::sleep(Duration::from_secs(1)).await;
    }
}

async fn process_message(data: String) -> Result<(), Box<dyn Error>> {
    let obj: Value = serde_json::from_str(&data)?;
    let body = obj.get("body").ok_or("No body found")?;
    let body_json = serde_json::to_string(body)?;
    let path = if obj["path"]
        .as_str()
        .unwrap()
        .contains("pusher_poker_existence")
    {
        "pusher_poker_existence"
    } else {
        "poker_timer"
    };
    println!("Got message: {} - {}", path, body_json);

    reqwest::Client::new()
        .post(&format!("http://localhost:3000/api/{}", path))
        .header("Content-Type", "application/json")
        .body(body_json)
        .send()
        .await?;

    Ok(())
}
