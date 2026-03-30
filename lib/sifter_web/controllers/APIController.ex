defmodule SifterWeb.APIController do
  use SifterWeb, :controller

  def upload(conn, %{"text" => text}) do
    json(conn, Sifter.AI.test(text))
  end
end
