defmodule SifterWeb.PageController do
  use SifterWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end
end
