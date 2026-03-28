from transformers import BertTokenizer, BertForSequenceClassification
import torch

model_name = "followsci/bert-ai-text-detector"
tokenizer = BertTokenizer.from_pretrained(model_name)
model = BertForSequenceClassification.from_pretrained(model_name)
model.eval()

def main(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)

    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        ai_prob = probs[0][1].item() * 100
    return ai_prob