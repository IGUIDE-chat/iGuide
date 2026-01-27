import os
import logging
import numpy as np
from typing import List
import onnxruntime as ort
from tokenizers import Tokenizer

from backend.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class EmbeddingModel:
    def __init__(self, model_dir: str = settings.MODEL_PATH):
        # We expect a file named "embedding.onnx" and "tokenizer.json" in model_dir
        self.model_path = os.path.join(model_dir, "embedding.onnx")
        self.tokenizer_path = os.path.join(model_dir, "embedding_tokenizer.json")
        self.session = None
        self.tokenizer = None
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path) or not os.path.exists(self.tokenizer_path):
            logger.warning(f"Embedding model not found at {self.model_path}. using fallback/mock.")
            return

        try:
            self.tokenizer = Tokenizer.from_file(self.tokenizer_path)
            self.tokenizer.enable_padding(pad_id=0, pad_token="[PAD]", length=512)
            self.tokenizer.enable_truncation(max_length=512)
            
            # Load ONNX model
            self.session = ort.InferenceSession(self.model_path)
            logger.info("Embedding Model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Embedding Model: {e}")

    def encode(self, text: str | List[str]) -> List[float] | List[List[float]]:
        if not self.session or not self.tokenizer:
            # Mock fallback if model missing
            if isinstance(text, str):
                return [0.1] * 1024
            return [[0.1] * 1024 for _ in text]

        if isinstance(text, str):
            text = [text]

        # Tokenize
        encoded = self.tokenizer.encode_batch(text)
        input_ids = np.array([e.ids for e in encoded], dtype=np.int64)
        attention_mask = np.array([e.attention_mask for e in encoded], dtype=np.int64)
        # Some models use token_type_ids, some don't. Assuming standard BERT-like
        token_type_ids = np.array([e.type_ids for e in encoded], dtype=np.int64)

        # Inference
        # Filter inputs based on what the model actually expects
        input_names = [i.name for i in self.session.get_inputs()]
        inputs = {
            "input_ids": input_ids,
            "attention_mask": attention_mask
        }
        if "token_type_ids" in input_names:
            inputs["token_type_ids"] = token_type_ids
        
        # Check model input names to be safe (optional, but good practice)
        # inputs = {k.name: v for k, v in inputs.items() if k.name in input_names} 
        
        outputs = self.session.run(None, inputs)
        
        # Mean Pooling (commonly used for sentence embeddings if simple BERT)
        # But usually 'last_hidden_state' is outputs[0]
        last_hidden_state = outputs[0]
        
        # Perform mean pooling logic here or assume model outputs pooled embedding?
        # ONNX exports from sentence-transformers usually output the embedding directly if configured,
        # otherwise we do mean pooling. 
        # For robustness, let's implement standard Mean Pooling:
        
        embeddings = self._mean_pooling(last_hidden_state, attention_mask)
        return embeddings.tolist()
        
    def _mean_pooling(self, token_embeddings, attention_mask):
        # token_embeddings shape: [batch, seq_len, hidden_size]
        # attention_mask shape: [batch, seq_len]
        
        input_mask_expanded = np.expand_dims(attention_mask, axis=-1)
        input_mask_expanded = np.broadcast_to(input_mask_expanded, token_embeddings.shape).astype(float)
        
        sum_embeddings = np.sum(token_embeddings * input_mask_expanded, axis=1)
        sum_mask = np.clip(input_mask_expanded.sum(axis=1), a_min=1e-9, a_max=None)
        
        return sum_embeddings / sum_mask

class RerankerModel:
    def __init__(self, model_dir: str = settings.MODEL_PATH):
        self.model_path = os.path.join(model_dir, "reranker.onnx")
        self.tokenizer_path = os.path.join(model_dir, "reranker_tokenizer.json")
        self.session = None
        self.tokenizer = None
        self._load_model()
        
    def _load_model(self):
        if not os.path.exists(self.model_path) or not os.path.exists(self.tokenizer_path):
            logger.warning(f"Reranker model not found at {self.model_path}. using fallback.")
            return

        try:
            self.tokenizer = Tokenizer.from_file(self.tokenizer_path)
            self.tokenizer.enable_padding(pad_id=0, pad_token="[PAD]", length=512)
            self.tokenizer.enable_truncation(max_length=512)
            
            self.session = ort.InferenceSession(self.model_path)
            logger.info("Reranker Model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Reranker Model: {e}")

    def predict(self, pairs: List[List[str]]) -> List[float]:
        """
        pairs: List of [query, document_text]
        """
        if not self.session or not self.tokenizer:
            # Mock fallback: return descending scores to mimic sorting
            return [0.9 - (i*0.1) for i in range(len(pairs))]

        # Tokenize pairs
        # Tokenizers encode_batch with pairs works differently depending on lib version/method
        # Usually: self.tokenizer.encode_batch([(q, d) for q, d in pairs])
        
        # Convert list of lists to list of tuples if needed
        tuple_pairs = [(p[0], p[1]) for p in pairs]
        
        encoded = self.tokenizer.encode_batch(tuple_pairs)
        input_ids = np.array([e.ids for e in encoded], dtype=np.int64)
        attention_mask = np.array([e.attention_mask for e in encoded], dtype=np.int64)
        token_type_ids = np.array([e.type_ids for e in encoded], dtype=np.int64)
        
        input_names = [i.name for i in self.session.get_inputs()]
        inputs = {
            "input_ids": input_ids,
            "attention_mask": attention_mask
        }
        if "token_type_ids" in input_names:
            inputs["token_type_ids"] = token_type_ids
        
        outputs = self.session.run(None, inputs)
        
        # Rerankers typically output logits. We want the score for the "relevant" class.
        # If it's BGE-Reranker etc, it might output a single scalar logit.
        logits = outputs[0]
        
        if logits.shape[1] == 1:
            scores = logits.flatten()
        else:
            # If 2 classes (not_relevant, relevant), take the second one
            scores = logits[:, 1]
            
        # Sigmoid to normalize if desired, or keep as raw logits
        return 1 / (1 + np.exp(-scores)) # Sigmoid
