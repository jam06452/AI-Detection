from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# Load model and tokenizer
model_path = "Oxidane/tmr-ai-text-detector"
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForSequenceClassification.from_pretrained(model_path)

tokenizer1 = AutoTokenizer.from_pretrained("GeorgeDrayson/modernbert-ai-detection")
model1 = AutoModelForSequenceClassification.from_pretrained("GeorgeDrayson/modernbert-ai-detection")

# Predict
text = """"""
inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512).to(torch.device("cpu"))

with torch.no_grad():
    outputs = model(**inputs)
    logits = outputs.logits
    probs = torch.softmax(logits, dim=-1)
    outputs1 = model1(**inputs)

# Probability that text is AI-generated
probability = probs[0][1].item()
probability1 = torch.nn.functional.softmax(outputs1.logits, dim=-1)
print(f"Oxidane Probability: {100 * probability:.4f}%")
print(f"George Drayson Probability: {100 * probability1[0][1].item():.4f}%")

# Compute average probability between the two models
prob1 = probability1[0][1].item()
avg_prob = (probability + prob1) / 2
print(f"Average AI probability: {100 * avg_prob:.4f}%")