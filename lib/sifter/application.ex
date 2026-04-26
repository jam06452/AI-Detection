defmodule Sifter.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      SifterWeb.Telemetry,
      {DNSCluster, query: Application.get_env(:sifter, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: Sifter.PubSub},
      Sifter.AIServer,
      # Start a worker by calling: Sifter.Worker.start_link(arg)
      # {Sifter.Worker, arg},
      # Start to serve requests, typically the last entry
      SifterWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Sifter.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    SifterWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
