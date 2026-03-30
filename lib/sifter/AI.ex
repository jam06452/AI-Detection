defmodule Sifter.AI do
  def test(text) do
    Nx.global_default_backend(EXLA.Backend)

    chunks =
      text
      |> String.split(~r/\s+/, trim: true)
      |> Enum.chunk_every(300, 150, [])
      |> Enum.map(&Enum.join(&1, " "))

    {:ok, model_info} = Bumblebee.load_model({:hf, "followsci/bert-ai-text-detector"})
    {:ok, tokenizer} = Bumblebee.load_tokenizer({:hf, "google-bert/bert-base-uncased"})
    serving = Bumblebee.Text.text_classification(model_info, tokenizer, top_k: nil)

    output = Nx.Serving.run(serving, chunks)

    chunk_scores =
      output
      |> Enum.map(fn result ->
        prediction = Enum.find(result.predictions, &(&1.label == "LABEL_1"))
        score = Map.get(prediction, :score)
        percent = Float.round(score * 100, 2)

        percent
      end)

    total =
      case chunk_scores do
        [] -> 0.0
        _ -> Float.round(Enum.sum(chunk_scores) / Enum.count(chunk_scores), 2)
      end

    %{total: total, chunk_scores: chunk_scores}
  end
end
