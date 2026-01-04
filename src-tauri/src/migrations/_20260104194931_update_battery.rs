use crate::migration::Migration;
use serde_json::Value;

static NEW_JSON: &str = r###"{
  "dimensions": {
    "height": 135,
    "width": 315
  },
  "elements": [
    {
      "children": [
        {
          "data": {
            "text": "<p>Battery</p>"
          },
          "id": "text-9Hw8",
          "label": "text-9Hw8",
          "styles": {
            "fontSize": "20px",
            "fontWeight": "bold",
            "lineHeight": "20px"
          },
          "type": "text"
        },
        {
          "children": [
            {
              "data": {
                "text": "<p>Charge ({{system:battery_charge}}%)</p>"
              },
              "id": "text-Vnhb",
              "label": "text-Vnhb",
              "styles": {
                "fontSize": "16px",
                "lineHeight": "16px"
              },
              "type": "text"
            },
            {
              "data": {
                "maxValue": "100",
                "thickness": "large",
                "value": "{{system:battery_charge}}"
              },
              "id": "progress-WxKK",
              "styles": {
                "padding": 0
              },
              "type": "progress"
            },
            {
              "children": [
                {
                  "data": {
                    "text": "<p>Health ({{system:battery_health}}%)</p>"
                  },
                  "id": "text-vEEY",
                  "label": "text-vEEY",
                  "styles": {
                    "fontSize": "16px",
                    "lineHeight": "16px"
                  },
                  "type": "text"
                },
                {
                  "data": {
                    "text": "<p>{{system:battery_cycles}} cycles</p>"
                  },
                  "id": "text-0LFf",
                  "label": "text-0LFf",
                  "styles": {
                    "fontSize": "12px",
                    "lineHeight": "12px"
                  },
                  "type": "text"
                }
              ],
              "data": {},
              "id": "container-QcYa",
              "label": "container-QcYa",
              "styles": {
                "alignItems": "center",
                "background": "transparent",
                "borderRadius": 2,
                "display": "flex",
                "flex": 1,
                "height": "100%",
                "justifyContent": "space-between",
                "padding": "0px",
                "width": "100%"
              },
              "type": "container"
            },
            {
              "data": {
                "maxValue": "100",
                "thickness": "large",
                "value": "{{system:battery_health}}"
              },
              "id": "progress-wqK8",
              "label": "progress-wqK8",
              "styles": {
                "padding": 0
              },
              "type": "progress"
            },
            {
              "children": [],
              "id": "container-DlyG",
              "styles": {
                "background": "transparent",
                "borderRadius": 2,
                "display": "flex",
                "flex": 1,
                "height": "100%",
                "padding": 5,
                "width": "100%"
              },
              "type": "container"
            }
          ],
          "data": {},
          "id": "container-VT9w",
          "label": "container-VT9w",
          "styles": {
            "background": "transparent",
            "borderRadius": 2,
            "display": "flex",
            "flex": 1,
            "flexDirection": "column",
            "gap": "10px",
            "height": "100%",
            "padding": "0px",
            "width": "100%"
          },
          "type": "container"
        }
      ],
      "data": {},
      "id": "container",
      "label": "container",
      "styles": {
        "background": "transparent",
        "backgroundColor": "#000000ff",
        "borderRadius": "10px",
        "display": "flex",
        "flex": 1,
        "flexDirection": "column",
        "gap": "15px",
        "padding": "10px",
        "width": "100%"
      },
      "type": "container"
    }
  ]
}"###;
pub struct UpdateBattery;

impl Migration for UpdateBattery {
    fn name(&self) -> &'static str {
        "20260104194931_update_battery"
    }

    fn up(&self, json: &mut Value) {
        let key = json
            .get("key")
            .and_then(|k| k.as_str())
            .unwrap_or("")
            .to_string();
        if key != "battery" {
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
