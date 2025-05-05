export const soccerConfig = {
    "3.0.0": {
        "model": "Xenova/GIST-small-Embedding-v0",
        "model_url": "https://danielruss.github.io/soccer-models/SOCcer_v3.0.0.onnx",
        "version": "1.0.0",
        "model_version": "3.0.0",
        "pipeline_config": {
            "dtype": "fp32",
            "quantized": false
        },
        "embedding_config": {
            "pooling": "cls",
            "normalize": true
        }
    }
}