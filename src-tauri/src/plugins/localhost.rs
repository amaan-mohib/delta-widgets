//! Expose your apps assets through a localhost server instead of the default custom protocol.
//!
//! **Note: This plugins brings considerable security risks and you should only use it if you know what your are doing. If in doubt, use the default custom protocol implementation.**

use std::{collections::HashMap, fs, path::Path};

use http::Uri;
use tauri::{
    plugin::{Builder as PluginBuilder, TauriPlugin},
    Manager, Runtime,
};
use tiny_http::{Header, Response as HttpResponse, Server};

pub struct Request {
    url: String,
}

impl Request {
    pub fn url(&self) -> &str {
        &self.url
    }
}

pub struct Response {
    headers: HashMap<String, String>,
}

impl Response {
    pub fn add_header<H: Into<String>, V: Into<String>>(&mut self, header: H, value: V) {
        self.headers.insert(header.into(), value.into());
    }
}

type OnRequest = Option<Box<dyn Fn(&Request, &mut Response) + Send + Sync>>;

pub struct Builder {
    port: u16,
    host: Option<String>,
    on_request: OnRequest,
}

impl Builder {
    pub fn new(port: u16) -> Self {
        Self {
            port,
            host: None,
            on_request: None,
        }
    }

    // Change the host the plugin binds to. Defaults to `localhost`.
    pub fn host<H: Into<String>>(mut self, host: H) -> Self {
        self.host = Some(host.into());
        self
    }

    pub fn on_request<F: Fn(&Request, &mut Response) + Send + Sync + 'static>(
        mut self,
        f: F,
    ) -> Self {
        self.on_request.replace(Box::new(f));
        self
    }

    pub fn build<R: Runtime>(mut self) -> TauriPlugin<R> {
        let port = self.port;
        let host = self.host.unwrap_or("localhost".to_string());
        let on_request = self.on_request.take();

        PluginBuilder::new("localhost")
            .setup(move |app, _api| {
                let default_asset_path = app
                    .path()
                    .resolve("files", tauri::path::BaseDirectory::AppCache)
                    .unwrap();
                println!("{:?}", default_asset_path.display());

                std::thread::spawn(move || {
                    let server =
                        Server::http(format!("{host}:{port}")).expect("Unable to spawn server");
                    println!("Localhost server running at http://{host}:{port}");
                    for req in server.incoming_requests() {
                        let mut asset_path = default_asset_path.clone();
                        let path: String = req
                            .url()
                            .parse::<Uri>()
                            .map(|uri| uri.path().into())
                            .unwrap_or_else(|_| req.url().into());
                        println!("Received request for: {}", path);
                        let paths = path.split('/');
                        for p in paths {
                            asset_path = asset_path.join(p);
                        }

                        if let Ok(exists) = fs::exists(asset_path.clone()) {
                            if !exists {
                                println!("File not found: {:?}", asset_path.display());
                                req.respond(
                                    HttpResponse::from_string("404 Not Found")
                                        .with_status_code(404),
                                )
                                .expect("unable to respond");
                            } else {
                                if let Some(data) = fs::read(asset_path.clone()).ok() {
                                    let mime_type =
                                        mime_guess::from_path::<&Path>(asset_path.as_ref())
                                            .first_or_octet_stream();

                                    let request = Request {
                                        url: req.url().into(),
                                    };
                                    let mut response = Response {
                                        headers: Default::default(),
                                    };

                                    response.add_header("Content-Type", mime_type.essence_str());

                                    if let Some(on_request) = &on_request {
                                        on_request(&request, &mut response);
                                    }

                                    let mut resp = HttpResponse::from_data(data);
                                    for (header, value) in response.headers {
                                        if let Ok(h) = Header::from_bytes(header.as_bytes(), value)
                                        {
                                            resp.add_header(h);
                                        }
                                    }
                                    req.respond(resp).expect("unable to setup response");
                                } else {
                                    println!("Error reading file: {:?}", asset_path.display());
                                    req.respond(
                                        HttpResponse::from_string("500 Internal Server Error")
                                            .with_status_code(500),
                                    )
                                    .expect("unable to respond");
                                };
                            }
                        }
                    }
                });
                Ok(())
            })
            .build()
    }
}
