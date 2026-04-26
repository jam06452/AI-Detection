defmodule Sifter.AI do
  def test(text) do
    Nx.global_default_backend(EXLA.Backend)

    chunks =
      text
      |> clean_text()
      |> String.split(~r/\s+/, trim: true)
      |> Enum.chunk_every(300, 150, [])
      |> Enum.map(&Enum.join(&1, " "))

    {:ok, model_info} =
      Bumblebee.load_model({:hf, "fakespot-ai/roberta-base-ai-text-detection-v1"})

    {:ok, tokenizer} = Bumblebee.load_tokenizer({:hf, "FacebookAI/roberta-base"})
    serving = Bumblebee.Text.text_classification(model_info, tokenizer, top_k: nil)

    output = Nx.Serving.run(serving, chunks)

    chunk_scores =
      output
      |> Enum.map(fn result ->
        score = ai_score(result.predictions)
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

  defp clean_text(text) do
    text
    |> String.replace(~r/\s+/, " ")
    |> String.trim()
  end

  defp ai_score(predictions) do
    case Enum.find(predictions, &(&1.label in ["AI", "LABEL_1"])) do
      nil -> 0.0
      prediction -> prediction.score
    end
  end
end
