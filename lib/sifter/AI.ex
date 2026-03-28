defmodule Sifter.AI do
  def test do
    Nx.global_default_backend(EXLA.Backend)
    {:ok, model_info} = Bumblebee.load_model({:hf, "followsci/bert-ai-text-detector"})
    {:ok, tokenizer} = Bumblebee.load_tokenizer({:hf, "google-bert/bert-base-uncased"})
    serving = Bumblebee.Text.text_classification(model_info, tokenizer, top_k: nil)

    text = "This is a test bit of text"

    output = Nx.Serving.run(serving, text)

    ai_prediction = Enum.find(output.predictions, &(&1.label == "LABEL_1"))
    "AI Probability: #{ai_prediction.score * 100}%"
  end
end
