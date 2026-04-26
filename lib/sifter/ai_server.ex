defmodule Sifter.AIServer do
  use GenServer
  require Logger

  def start_link(_) do
    GenServer.start_link(__MODULE__, nil, name: __MODULE__)
  end

  def init(_) do
    Logger.info("Loading AI models...")
    Nx.global_default_backend(EXLA.Backend)

    {:ok, model_info} =
      Bumblebee.load_model({:hf, "fakespot-ai/roberta-base-ai-text-detection-v1"})

    {:ok, tokenizer} = Bumblebee.load_tokenizer({:hf, "FacebookAI/roberta-base"})
    serving = Bumblebee.Text.text_classification(model_info, tokenizer, top_k: nil)

    Logger.info("AI models loaded successfully")
    {:ok, serving}
  end

  def analyze(text) do
    GenServer.call(__MODULE__, {:analyze, text}, :infinity)
  end

  def handle_call({:analyze, text}, _from, serving) do
    result = Sifter.AI.analyze_with_serving(serving, text)
    {:reply, result, serving}
  end
end
