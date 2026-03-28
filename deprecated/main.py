from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

tokenizer = AutoTokenizer.from_pretrained("GeorgeDrayson/modernbert-ai-detection")
model = AutoModelForSequenceClassification.from_pretrained("GeorgeDrayson/modernbert-ai-detection")

tokenizer1 = AutoTokenizer.from_pretrained("GeorgeDrayson/modernbert-ai-detection-raid-mage")
model1 = AutoModelForSequenceClassification.from_pretrained("GeorgeDrayson/modernbert-ai-detection-raid-mage")


model = model.to(torch.device("cpu"))
model.eval()
model1 = model1.to(torch.device("cpu"))
model1.eval()

text = """
Octopussy and The Living Daylights (sometimes published as Octopussy) is the fourteenth and final James Bond book written by Ian Fleming. The book is a collection of short stories published in the United Kingdom by Jonathan Cape on 23 June 1966, after Fleming's death in August 1964.

The book originally contained two stories, "Octopussy" and "The Living Daylights"; subsequent editions also included "The Property of a Lady" and then "007 in New York". The stories first appeared in different publications: "Octopussy" was serialised in the Daily Express in October 1965; "The Living Daylights" appeared in The Sunday Times colour supplement on 4 February 1962; "The Property of a Lady" was commissioned by Sotheby's for the 1963 edition of their journal, The Ivory Hammer; and "007 in New York" appeared in the New York Herald Tribune in October 1963.

Many of the elements of the stories are from Fleming's own interests and experiences, including climbing in Kitzbühel, Austria, wartime commando deeds and the sea-life of Jamaica. He used the names of friends and acquaintances for characters within the stories and also used a recipe for scrambled eggs given to him by a friend.

The two original stories, "Octopussy" and "The Living Daylights", were adapted for publication in comic strip format in the Daily Express in 1966–1967. Elements from the stories have also been used in the Eon Productions Bond films. Octopussy, starring Roger Moore as James Bond, was released in 1983 as the thirteenth film in the series and Fleming's story provided the background for the character Octopussy; "The Property of a Lady" was closely adapted for an auction sequence in the film. The Living Daylights, released in 1987, is the fifteenth Bond film produced by Eon and stars Timothy Dalton in his first appearance as Bond. "007 in New York" provided character and plot elements for the first two films starring Daniel Craig as Bond, Casino Royale and Quantum of Solace. 
"""

inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=4096).to(torch.device("cpu"))

with torch.no_grad():
    outputs = model(**inputs)
    outputs1 = model1(**inputs)

probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
probabilities1 = torch.nn.functional.softmax(outputs1.logits, dim=-1)
print(f"Probability of machine-generated text: {probabilities[0][1].item() * 100:.4f}%")
print(f"Probability of machine-generated text (model1): {probabilities1[0][1].item() * 100:.4f}%")