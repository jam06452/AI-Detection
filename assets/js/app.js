// If you want to use Phoenix channels, run `mix help phx.gen.channel`
// to get started and then uncomment the line below.
// import "./user_socket.js"

// You can include dependencies in two ways.
//
// The simplest option is to put them in assets/vendor and
// import them using relative paths:
//
//     import "../vendor/some-package.js"
//
// Alternatively, you can `npm install some-package --prefix assets` and import
// them using a path starting with the package name:
//
//     import "some-package"
//
// If you have dependencies that try to import CSS, esbuild will generate a separate `app.css` file.
// To load it, simply add a second `<link>` to your `root.html.heex` file.

// Include phoenix_html to handle method=PUT/DELETE in forms and buttons.
import "phoenix_html"
// Establish Phoenix Socket and LiveView configuration.
import {Socket} from "phoenix"
import {LiveSocket} from "phoenix_live_view"
import {hooks as colocatedHooks} from "phoenix-colocated/sifter"
import topbar from "../vendor/topbar"

const setTheme = (theme) => {
  if (theme === "system") {
    localStorage.removeItem("phx:theme")
    document.documentElement.removeAttribute("data-theme")
  } else {
    localStorage.setItem("phx:theme", theme)
    document.documentElement.setAttribute("data-theme", theme)
  }
}

if (!document.documentElement.hasAttribute("data-theme")) {
  setTheme(localStorage.getItem("phx:theme") || "system")
}

window.addEventListener("storage", (event) => {
  if (event.key === "phx:theme") {
    setTheme(event.newValue || "system")
  }
})

window.addEventListener("phx:set-theme", (event) => {
  setTheme(event.target?.dataset?.phxTheme || "system")
})

const csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content")
const liveSocket = new LiveSocket("/live", Socket, {
  longPollFallbackMs: 2500,
  params: {_csrf_token: csrfToken},
  hooks: {...colocatedHooks},
})

// Show progress bar on live navigation and form submits
topbar.config({barColors: {0: "#29d"}, shadowColor: "rgba(0, 0, 0, .3)"})
window.addEventListener("phx:page-loading-start", _info => topbar.show(300))
window.addEventListener("phx:page-loading-stop", _info => topbar.hide())

// connect if there are any LiveViews on the page
liveSocket.connect()

// expose liveSocket on window for web console debug logs and latency simulation:
// >> liveSocket.enableDebug()
// >> liveSocket.enableLatencySim(1000)  // enabled for duration of browser session
// >> liveSocket.disableLatencySim()
window.liveSocket = liveSocket

// The lines below enable quality of life phoenix_live_reload
// development features:
//
//     1. stream server logs to the browser console
//     2. click on elements to jump to their definitions in your code editor
//
if (process.env.NODE_ENV === "development") {
  window.addEventListener("phx:live_reload:attached", ({detail: reloader}) => {
    // Enable server log streaming to client.
    // Disable with reloader.disableServerLogs()
    reloader.enableServerLogs()

    // Open configured PLUG_EDITOR at file:line of the clicked element's HEEx component
    //
    //   * click with "c" key pressed to open at caller location
    //   * click with "d" key pressed to open at function component definition location
    let keyDown
    window.addEventListener("keydown", e => keyDown = e.key)
    window.addEventListener("keyup", _e => keyDown = null)
    window.addEventListener("click", e => {
      if(keyDown === "c"){
        e.preventDefault()
        e.stopImmediatePropagation()
        reloader.openEditorAtCaller(e.target)
      } else if(keyDown === "d"){
        e.preventDefault()
        e.stopImmediatePropagation()
        reloader.openEditorAtDef(e.target)
      }
    }, true)

    window.liveReloader = reloader
  })
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const splitTextByCharRanges = (text, chunkCount) => {
  if (!text || chunkCount <= 0) return []

  const count = Math.max(1, chunkCount)
  const chunks = []

  for (let index = 0; index < count; index += 1) {
    const start = Math.floor((index / count) * text.length)
    const end = Math.floor(((index + 1) / count) * text.length)
    chunks.push(text.slice(start, end))
  }

  return chunks.filter((chunk) => chunk.length > 0)
}

const scoreToRiskLabel = (score) => {
  if (score >= 70) return "High AI signal"
  if (score >= 40) return "Moderate AI signal"
  return "Low AI signal"
}

const scoreToHighlightColor = (score) => {
  const alpha = (0.08 + (clamp(score, 0, 100) / 100) * 0.42).toFixed(3)
  return `rgba(251, 146, 60, ${alpha})`
}

const escapeHtml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;")

const markdownInlineToHtml = (value) => {
  if (!value) return ""

  let inline = value

  inline = inline.replace(/`([^`]+)`/g, "<code>$1</code>")
  inline = inline.replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  inline = inline.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  inline = inline.replace(/__(.+?)__/g, "<strong>$1</strong>")
  inline = inline.replace(/\*(.+?)\*/g, "<em>$1</em>")
  inline = inline.replace(/_(.+?)_/g, "<em>$1</em>")

  return inline
}

const markdownToHtml = (value) => {
  if (!value?.trim()) return ""

  const normalized = value.replace(/\r\n?/g, "\n")
  let safe = escapeHtml(normalized)
  const codeBlocks = []

  safe = safe.replace(/```([a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g, (_match, lang, code) => {
    const token = `__CODE_BLOCK_${codeBlocks.length}__`
    const className = lang ? ` class="language-${lang}"` : ""
    codeBlocks.push(`<pre><code${className}>${code.trimEnd()}</code></pre>`)
    return token
  })

  const lines = safe.split("\n")
  const html = []
  let paragraph = []
  let inUl = false
  let inOl = false
  let inBlockquote = false

  const closeParagraph = () => {
    if (!paragraph.length) return
    html.push(`<p>${markdownInlineToHtml(paragraph.join("<br />"))}</p>`)
    paragraph = []
  }

  const closeLists = () => {
    if (inUl) {
      html.push("</ul>")
      inUl = false
    }

    if (inOl) {
      html.push("</ol>")
      inOl = false
    }
  }

  const closeBlockquote = () => {
    if (!inBlockquote) return
    html.push("</blockquote>")
    inBlockquote = false
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd()

    if (!line.trim()) {
      closeParagraph()
      closeLists()
      closeBlockquote()
      return
    }

    if (/^__CODE_BLOCK_\d+__$/.test(line.trim())) {
      closeParagraph()
      closeLists()
      closeBlockquote()
      html.push(line.trim())
      return
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      closeParagraph()
      closeLists()
      closeBlockquote()
      const level = heading[1].length
      html.push(`<h${level}>${markdownInlineToHtml(heading[2])}</h${level}>`)
      return
    }

    const hr = line.match(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/)
    if (hr) {
      closeParagraph()
      closeLists()
      closeBlockquote()
      html.push("<hr />")
      return
    }

    const ulItem = line.match(/^\s*[-*]\s+(.+)$/)
    if (ulItem) {
      closeParagraph()
      closeBlockquote()
      if (!inUl) {
        closeLists()
        inUl = true
        html.push("<ul>")
      }

      html.push(`<li>${markdownInlineToHtml(ulItem[1])}</li>`)
      return
    }

    const olItem = line.match(/^\s*\d+\.\s+(.+)$/)
    if (olItem) {
      closeParagraph()
      closeBlockquote()
      if (!inOl) {
        closeLists()
        inOl = true
        html.push("<ol>")
      }

      html.push(`<li>${markdownInlineToHtml(olItem[1])}</li>`)
      return
    }

    const quote = line.match(/^>\s?(.+)$/)
    if (quote) {
      closeParagraph()
      closeLists()

      if (!inBlockquote) {
        inBlockquote = true
        html.push("<blockquote>")
      }

      html.push(`<p>${markdownInlineToHtml(quote[1])}</p>`)
      return
    }

    closeLists()
    closeBlockquote()
    paragraph.push(line)
  })

  closeParagraph()
  closeLists()
  closeBlockquote()

  let rendered = html.join("")

  codeBlocks.forEach((block, index) => {
    rendered = rendered.replace(`__CODE_BLOCK_${index}__`, block)
  })

  return rendered
}

const hasMarkdownSyntax = (value) => {
  if (!value) return false

  return /(^|\n)#{1,6}\s|(^|\n)\s*[-*]\s|(^|\n)\s*\d+\.\s|```|`[^`]+`|\*\*.+?\*\*|\[.+?\]\(.+?\)|(^|\n)>\s/.test(value)
}

const scoreForIndex = (scores, index, totalItems) => {
  if (!Array.isArray(scores) || scores.length === 0 || totalItems <= 0) return null

  const ratio = scores.length / totalItems
  const scoreIndex = Math.min(scores.length - 1, Math.floor(index * ratio))
  return scores[scoreIndex] ?? null
}

const initializeDetector = () => {
  const form = document.getElementById("ai-detector-form")
  if (!form) return

  const input = document.getElementById("detector-input")
  const charCount = document.getElementById("detector-char-count")
  const submitButton = document.getElementById("detect-ai-button")
  const totalScore = document.getElementById("total-score")
  const scoreBar = document.getElementById("total-score-bar")
  const riskLabel = document.getElementById("total-risk-label")
  const chunkList = document.getElementById("chunk-list")
  const chunkCount = document.getElementById("chunk-count")

  const scoreToRiskLabel = (score) => {
    if (score >= 70) return "High likelihood"
    if (score >= 40) return "Moderate likelihood"
    return "Low likelihood"
  }

  const updateCharCount = () => {
    if (!input || !charCount) return
    charCount.textContent = `${input.value.length} chars`
  }

  const resetView = (message) => {
    if (totalScore) totalScore.textContent = "--"
    if (scoreBar) {
      scoreBar.style.width = "0%"
      scoreBar.setAttribute("aria-valuenow", "0")
    }
    if (riskLabel) riskLabel.textContent = message || "Waiting for analysis"

    if (chunkList) {
      chunkList.innerHTML = ""
    }

    if (chunkCount) {
      chunkCount.textContent = "0 chunks"
    }
  }

  const setLoadingState = (isLoading) => {
    form.setAttribute("aria-busy", `${isLoading}`)

    if (submitButton) {
      submitButton.disabled = isLoading
      submitButton.classList.toggle("skeleton-loading", isLoading)
      submitButton.setAttribute("aria-busy", `${isLoading}`)
    }

    if (input) {
      input.disabled = isLoading
      input.setAttribute("aria-disabled", `${isLoading}`)
    }
  }

  const renderChunkSkeleton = () => {
    if (!chunkList) return

    chunkList.innerHTML = ""

    for (let index = 0; index < 3; index += 1) {
      const item = document.createElement("li")
      item.className = "chunk-item skeleton-loading"
      item.innerHTML = `
        <span class="chunk-text" style="flex: 1;">Loading...</span>
        <span class="chunk-score">--</span>
      `
      chunkList.appendChild(item)
    }

    if (chunkCount) {
      chunkCount.textContent = "Analyzing..."
    }
  }

  const renderResults = (text, payload) => {
    const total = clamp(Number(payload?.total ?? 0), 0, 100)
    const scores = Array.isArray(payload?.chunk_scores)
      ? payload.chunk_scores.map((score) => clamp(Number(score ?? 0), 0, 100))
      : []

    if (totalScore) totalScore.textContent = total.toFixed(2)
    if (scoreBar) {
      scoreBar.style.width = `${total}%`
      scoreBar.setAttribute("aria-valuenow", total.toFixed(2))
    }
    if (riskLabel) riskLabel.textContent = scoreToRiskLabel(total)

    if (!chunkList) return

    chunkList.innerHTML = ""

    const chunks = splitTextByCharRanges(text, scores.length || 1)

    if (chunkCount) {
      chunkCount.textContent = `${chunks.length} ${chunks.length === 1 ? "chunk" : "chunks"}`
    }

    chunks.forEach((chunkText, index) => {
      const score = scores[index] ?? 0

      const item = document.createElement("li")
      item.className = "chunk-item"
      
      const shortText = chunkText.substring(0, 80) + (chunkText.length > 80 ? "..." : "")
      
      item.innerHTML = `
        <span class="chunk-text">${escapeHtml(shortText)}</span>
        <span class="chunk-score">${score.toFixed(2)}%</span>
      `
      chunkList.appendChild(item)
    })
  }

  updateCharCount()
  input?.addEventListener("input", () => {
    updateCharCount()
  })

  form.addEventListener("submit", async (event) => {
    event.preventDefault()

    const text = input?.value?.trim() || ""

    if (text.length < 10) {
      resetView("Please add more text before running detection.")
      return
    }

    setLoadingState(true)
    renderChunkSkeleton()

    if (riskLabel) riskLabel.textContent = "Analyzing..."

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({text}),
      })

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }

      const payload = await response.json()
      renderResults(text, payload)
    } catch (_error) {
      resetView("Could not analyze this text right now. Please try again.")
    } finally {
      setLoadingState(false)
    }
  })
}

initializeDetector()

