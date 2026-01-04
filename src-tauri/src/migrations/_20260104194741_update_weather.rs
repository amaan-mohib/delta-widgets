use crate::migration::Migration;
use serde_json::Value;

static NEW_JSON: &str = r#"{
  "dimensions": {
    "height": 100,
    "width": 270
  },
  "elements": [
    {
      "children": [
        {
          "data": {
            "alt": "image",
            "src": "{{weather:icon}}"
          },
          "id": "image-mvbh",
          "label": "image-mvbh",
          "styles": {
            "height": "80px",
            "width": "80px"
          },
          "type": "image"
        },
        {
          "children": [
            {
              "data": {
                "text": "<h2><strong>{{weather:temperature_celsius}}</strong></h2>"
              },
              "id": "text-hJJR",
              "label": "text-hJJR",
              "styles": {
                "fontSize": "16px",
                "lineHeight": "16px",
                "textAlign": "left"
              },
              "type": "text"
            },
            {
              "data": {
                "text": "<p>{{weather:city}}, {{weather:country}}</p>"
              },
              "id": "text-DIX2",
              "label": "text-DIX2",
              "styles": {
                "fontSize": "14px",
                "lineHeight": "14px"
              },
              "type": "text"
            }
          ],
          "data": {},
          "id": "container-h6Jt",
          "label": "container-h6Jt",
          "styles": {
            "background": "transparent",
            "borderRadius": 2,
            "display": "flex",
            "flex": 1,
            "flexDirection": "column",
            "gap": "10px",
            "height": "100%",
            "justifyContent": "center",
            "padding": 5,
            "width": "100%"
          },
          "type": "container"
        }
      ],
      "data": {},
      "id": "container",
      "label": "container",
      "styles": {
        "alignItems": "center",
        "background": "transparent",
        "backgroundColor": "rgba(0, 0, 0, 1)",
        "backgroundImage": "",
        "borderRadius": "10px",
        "display": "flex",
        "flex": 1,
        "gap": "10px",
        "justifyContent": "center",
        "padding": "10px",
        "width": "100%"
      },
      "type": "container"
    }
  ]
}"#;

pub struct UpdateWeather;

impl Migration for UpdateWeather {
    fn name(&self) -> &'static str {
        "20260104194741_update_weather"
    }

    fn up(&self, json: &mut Value) {
        let key = json
            .get("key")
            .and_then(|k| k.as_str())
            .unwrap_or("")
            .to_string();
        if key != "weather" {
            return;
        }
        if let Ok(new_json_value) = serde_json::from_str::<serde_json::Value>(NEW_JSON) {
            if let Some(elements) = new_json_value.get("elements") {
                json["elements"] = elements.clone();
            }
            if let Some(dimensions) = new_json_value.get("dimensions") {
                json["dimensions"] = dimensions.clone();
            }
        } else {
            println!("JSON syntax error");
        }
    }

    fn down(&self, _json: &mut Value) {
        // TODO: implement rollback
    }
}
