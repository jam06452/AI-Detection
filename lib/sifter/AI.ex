defmodule Sifter.AI do
  def test(text) do
    analyze_with_cached_model(text)
  end

  def analyze_with_serving(serving, text) do
    chunks =
      text
      |> clean_text()
      |> String.split(~r/\s+/, trim: true)
      |> Enum.chunk_every(300, 150, [])
      |> Enum.map(&Enum.join(&1, " "))

    chunk_scores =
      chunks
      |> Task.async_stream(
        fn chunk ->
          output = Nx.Serving.run(serving, [chunk])
          result = Enum.at(output, 0)
          ai_score(result.predictions)
        end,
        timeout: :infinity,
        max_concurrency: System.schedulers_online()
      )
      |> Stream.map(fn {:ok, score} -> Float.round(score * 100, 2) end)
      |> Enum.to_list()

    total =
      case chunk_scores do
        [] -> 0.0
        _ -> Float.round(Enum.sum(chunk_scores) / Enum.count(chunk_scores), 2)
      end

    %{total: total, chunk_scores: chunk_scores}
  end

  defp analyze_with_cached_model(text) do
    Sifter.AIServer.analyze(text)
  end

  def stress_test(duration_seconds \\ 60) do
    # Large sample text for stress testing
    sample_text =
      String.duplicate(
        "This is a test text that will be analyzed for AI detection. " <>
          "It contains multiple sentences and various content patterns. " <>
          "The AI detection model will process this text through several chunks " <>
          "to determine if it was written by artificial intelligence. ",
        10
      )

    start_time = System.monotonic_time(:millisecond)
    total_chars = String.length(sample_text)
    end_time_target = start_time + duration_seconds * 1000

    {total_iterations, total_chars_processed} =
      1..System.schedulers_online()
      |> Task.async_stream(
        fn _ ->
          Stream.repeatedly(fn ->
            analyze_with_cached_model(sample_text)
          end)
          |> Stream.take_while(fn _ ->
            System.monotonic_time(:millisecond) < end_time_target
          end)
          |> Enum.count()
        end,
        timeout: :infinity
      )
      |> Stream.map(fn {:ok, count} -> count end)
      |> Enum.sum()
      |> then(fn total_runs ->
        {total_runs, total_runs * total_chars}
      end)

    elapsed_seconds = (System.monotonic_time(:millisecond) - start_time) / 1000.0

    chars_per_second = total_chars_processed / elapsed_seconds

    %{
      duration_seconds: elapsed_seconds,
      total_iterations: total_iterations,
      total_chars_processed: total_chars_processed,
      chars_per_second: Float.round(chars_per_second, 2),
      throughput_info: "#{Float.round(chars_per_second / 1000, 2)}K chars/sec"
    }
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
