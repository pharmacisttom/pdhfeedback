/**
 * PdhFeedback Embeddable Survey Widget v1.0
 * 
 * Provides secure, isolated, and accessible survey embedding for host websites.
 * Supports both Inline iframe and Modal Dialog Button modes.
 * 
 * Security Principles:
 * - Isolated within iframe security boundary
 * - No global CSS pollution
 * - Does not read host cookies, form inputs, or local storage
 * - No document.write or eval
 * - Strict postMessage origin & source validation
 * - Focus management and keyboard accessibility (ESC to close dialog)
 */
(function (window, document) {
  "use strict";

  // Prevent multiple executions of the library itself
  if (window.__pdhfeedback_widget_loaded) return;
  window.__pdhfeedback_widget_loaded = true;

  // Resolve current script tag and base URL
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      for (var i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && scripts[i].src.indexOf("/widget/v1.js") !== -1) {
          return scripts[i];
        }
      }
      return null;
    })();

  var defaultAppUrl = "";
  if (currentScript && currentScript.src) {
    var a = document.createElement("a");
    a.href = currentScript.src;
    defaultAppUrl = a.protocol + "//" + a.host;
  } else {
    defaultAppUrl = window.location.protocol + "//" + window.location.host;
  }

  // Inject minimalist scoped CSS once for Dialog mode
  var styleId = "pdhfeedback-widget-styles";
  if (!document.getElementById(styleId)) {
    var style = document.createElement("style");
    style.id = styleId;
    style.textContent = [
      ".pdh-btn { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: inline-flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; border: 0; outline: none; transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease; user-select: none; }",
      ".pdh-btn:active { transform: scale(0.97); }",
      ".pdh-btn-floating { position: fixed; bottom: 24px; right: 24px; z-index: 999990; padding: 12px 20px; border-radius: 9999px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1); }",
      ".pdh-btn-inline { padding: 10px 18px; border-radius: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.08); font-size: 14px; }",
      ".pdh-overlay { position: fixed; inset: 0; z-index: 999999; background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 16px; opacity: 0; pointer-events: none; transition: opacity 0.2s ease-in-out; }",
      ".pdh-overlay.pdh-open { opacity: 1; pointer-events: auto; }",
      ".pdh-dialog { position: relative; width: 100%; max-width: 540px; max-height: 90vh; background: #ffffff; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); display: flex; flex-direction: column; overflow: hidden; transform: scale(0.95); transition: transform 0.2s ease-out; }",
      ".pdh-overlay.pdh-open .pdh-dialog { transform: scale(1); }",
      ".pdh-close-btn { position: absolute; top: 14px; right: 14px; width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; border: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #475569; font-size: 18px; font-weight: 700; z-index: 10; transition: background 0.15s ease, color 0.15s ease; }",
      ".pdh-close-btn:hover { background: #e2e8f0; color: #0f172a; }",
      ".pdh-iframe-container { width: 100%; position: relative; overflow: hidden; }",
      ".pdh-iframe { width: 100%; border: 0; display: block; background: transparent; transition: height 0.2s ease; }",
      "@media (max-width: 640px) { .pdh-dialog { max-width: 100%; height: 95vh; border-radius: 20px 20px 0 0; margin-top: auto; margin-bottom: 0; } .pdh-btn-floating { bottom: 16px; right: 16px; padding: 10px 16px; font-size: 13px; } }"
    ].join("\n");
    document.head.appendChild(style);
  }

  // Registry of initialized iframes: { publicationId: { iframe, container, mode, appUrl, triggerBtn, overlay } }
  var instances = {};

  /**
   * Initializes a single widget element
   */
  function initWidgetElement(el) {
    if (el.dataset.pdhInitialized === "true") return;

    var embedId =
      el.getAttribute("data-pdhfeedback-widget") ||
      el.getAttribute("data-pdhfeedback-embed") ||
      el.getAttribute("data-embed-id");

    if (!embedId) {
      if (currentScript) {
        embedId = currentScript.getAttribute("data-pdhfeedback-embed");
      }
    }

    if (!embedId) return;

    var appUrl = el.getAttribute("data-app-url") || defaultAppUrl;
    var mode = el.getAttribute("data-mode") || (el.hasAttribute("data-button-text") ? "dialog" : "inline");
    var buttonText = el.getAttribute("data-button-text") || "ประเมินความพึงพอใจ";
    var buttonColor = el.getAttribute("data-button-color") || "#0f766e"; // teal-700
    var buttonTextColor = el.getAttribute("data-button-text-color") || "#ffffff";
    var isFloating = el.getAttribute("data-floating") === "true";
    var lang = el.getAttribute("data-lang") || "";
    var minHeight = parseInt(el.getAttribute("data-min-height") || "480", 10);

    el.dataset.pdhInitialized = "true";

    var embedUrl = appUrl + "/embed/" + encodeURIComponent(embedId);
    var queryParams = [];
    if (lang) queryParams.push("lang=" + encodeURIComponent(lang));
    queryParams.push("parentOrigin=" + encodeURIComponent(window.location.origin));
    if (queryParams.length > 0) {
      embedUrl += "?" + queryParams.join("&");
    }

    if (mode === "dialog") {
      // 1. Create trigger button
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pdh-btn " + (isFloating ? "pdh-btn-floating" : "pdh-btn-inline");
      btn.style.backgroundColor = buttonColor;
      btn.style.color = buttonTextColor;
      btn.setAttribute("aria-haspopup", "dialog");
      btn.setAttribute("aria-expanded", "false");

      // Star icon SVG
      var starSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      starSvg.setAttribute("viewBox", "0 0 24 24");
      starSvg.setAttribute("width", "16");
      starSvg.setAttribute("height", "16");
      starSvg.setAttribute("fill", "currentColor");
      var starPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      starPath.setAttribute(
        "d",
        "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      );
      starSvg.appendChild(starPath);
      btn.appendChild(starSvg);

      var btnLabel = document.createElement("span");
      btnLabel.textContent = buttonText;
      btn.appendChild(btnLabel);

      el.appendChild(btn);

      // 2. Create Modal Dialog Overlay
      var overlay = document.createElement("div");
      overlay.className = "pdh-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", "แบบประเมินความพึงพอใจ");

      var dialog = document.createElement("div");
      dialog.className = "pdh-dialog";

      // Close button
      var closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "pdh-close-btn";
      closeBtn.setAttribute("aria-label", "ปิดหน้าต่างประเมิน");
      closeBtn.innerHTML = "&times;";

      // Iframe container
      var iframeContainer = document.createElement("div");
      iframeContainer.className = "pdh-iframe-container";

      var iframe = document.createElement("iframe");
      iframe.className = "pdh-iframe";
      iframe.src = embedUrl;
      iframe.title = "แบบประเมินความพึงพอใจ";
      iframe.style.height = minHeight + "px";
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("referrerpolicy", "strict-origin");
      iframe.setAttribute("allow", "clipboard-write");

      iframeContainer.appendChild(iframe);
      dialog.appendChild(closeBtn);
      dialog.appendChild(iframeContainer);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // Functions to open / close dialog with accessibility focus management
      function openDialog() {
        overlay.classList.add("pdh-open");
        btn.setAttribute("aria-expanded", "true");
        closeBtn.focus();
        document.body.style.overflow = "hidden";
      }

      function closeDialog() {
        overlay.classList.remove("pdh-open");
        btn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
        btn.focus();
      }

      btn.addEventListener("click", openDialog);
      closeBtn.addEventListener("click", closeDialog);

      // Backdrop click
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) {
          closeDialog();
        }
      });

      // Escape key listener
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && overlay.classList.contains("pdh-open")) {
          closeDialog();
        }
      });

      instances[embedId] = {
        iframe: iframe,
        container: el,
        mode: "dialog",
        appUrl: appUrl,
        triggerBtn: btn,
        overlay: overlay,
        closeDialog: closeDialog,
      };
    } else {
      // Inline mode: embed directly inside container
      var inlineContainer = document.createElement("div");
      inlineContainer.className = "pdh-iframe-container";

      var inlineIframe = document.createElement("iframe");
      inlineIframe.className = "pdh-iframe";
      inlineIframe.src = embedUrl;
      inlineIframe.title = "แบบประเมินความพึงพอใจ";
      inlineIframe.style.height = minHeight + "px";
      inlineIframe.setAttribute("loading", "lazy");
      inlineIframe.setAttribute("referrerpolicy", "strict-origin");
      inlineIframe.setAttribute("allow", "clipboard-write");

      inlineContainer.appendChild(inlineIframe);
      el.appendChild(inlineContainer);

      instances[embedId] = {
        iframe: inlineIframe,
        container: el,
        mode: "inline",
        appUrl: appUrl,
      };
    }
  }

  // Scan and initialize widgets on DOM load
  function scanAndInit() {
    var widgetEls = document.querySelectorAll("[data-pdhfeedback-widget], [data-pdhfeedback-embed]");
    for (var i = 0; i < widgetEls.length; i++) {
      initWidgetElement(widgetEls[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scanAndInit);
  } else {
    scanAndInit();
  }

  // Global postMessage Listener
  window.addEventListener("message", function (event) {
    // Basic origin and data validation
    if (!event.data || typeof event.data !== "object") return;
    var data = event.data;
    if (!data.type || data.type.indexOf("pdhfeedback:") !== 0) return;

    var pubId = data.publicationId;
    if (!pubId || !instances[pubId]) return;

    var inst = instances[pubId];

    // Verify origin matches target appUrl
    if (inst.appUrl && event.origin !== inst.appUrl) {
      // Allow localhost port variations in development
      var isOriginMatch =
        event.origin === inst.appUrl ||
        (event.origin.indexOf("http://localhost:") === 0 && inst.appUrl.indexOf("http://localhost:") === 0);
      if (!isOriginMatch) return;
    }

    // Verify source window matches target iframe
    if (inst.iframe && inst.iframe.contentWindow !== event.source) {
      return;
    }

    switch (data.type) {
      case "pdhfeedback:resize":
        if (typeof data.height === "number" && inst.iframe) {
          // Clamp height to prevent layout exploitation
          var clampedHeight = Math.max(320, Math.min(1400, data.height));
          inst.iframe.style.height = clampedHeight + "px";
        }
        break;

      case "pdhfeedback:submitted":
        // Dispatch custom DOM event on container so host page scripts can respond
        try {
          var customEvent = new CustomEvent("pdhfeedback:submitted", {
            detail: { publicationId: pubId, timestamp: data.timestamp || Date.now() },
            bubbles: true,
          });
          inst.container.dispatchEvent(customEvent);
        } catch (e) {}

        // Auto-close dialog after 2.5s if in dialog mode
        if (inst.mode === "dialog" && typeof inst.closeDialog === "function") {
          setTimeout(function () {
            inst.closeDialog();
          }, 2500);
        }
        break;

      case "pdhfeedback:close":
        if (inst.mode === "dialog" && typeof inst.closeDialog === "function") {
          inst.closeDialog();
        }
        break;

      case "pdhfeedback:error":
        try {
          var errEvent = new CustomEvent("pdhfeedback:error", {
            detail: { publicationId: pubId, code: data.code || "UNKNOWN_ERROR" },
            bubbles: true,
          });
          inst.container.dispatchEvent(errEvent);
        } catch (e) {}
        break;
    }
  });

  // Export public API for programmatic initialization
  window.PdhFeedback = {
    init: scanAndInit,
    initElement: initWidgetElement,
    instances: instances,
  };
})(window, document);
