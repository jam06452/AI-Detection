# How to run

- Either pull the container from the repo or clone it.
- Then start it but make sure you have "SECRET_KEY_BASE" configured, look in the premade compose for one.

# Tech Stack

- Elixir Phoenix, with simple tailwind
- The frontend calls the backend with json of the text, the backend returns the overall AI percentage, and a percentage for each chunk

# What this does

It takes a text input, it parses it, puts it into chunks, sends the chunks in parrallel through my AI Detection model. Then it returns a decimal output which I then jsonify to return to the frontend. The frontend then highlights which chunks are the most AI generated on a gradient.