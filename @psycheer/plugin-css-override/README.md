# CSS Override Plugin

Custom CSS override plugin for NocoBase.

## Usage

Add your custom CSS styles in the client plugin file.

I'm using this plugin to override some default styles in NocoBase for Vditor.

```css Vditor Dark Theme Override
/* Vditor Dark Theme - Override CSS Variables */
.vditor {
    --border-color: #333333 !important;
    --second-color: rgba(200, 200, 200, 0.36) !important;
    --panel-background-color: #151515 !important;
    --panel-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
    --toolbar-background-color: #141414 !important;
    --toolbar-icon-color: #a0a0a0 !important;
    --toolbar-icon-hover-color: #4285f4 !important;
    --toolbar-height: 35px !important;
    --toolbar-divider-margin-top: 8px !important;
    --textarea-background-color: #151515 !important;
    --textarea-text-color: #e0e0e0 !important;
    --resize-icon-color: #a0a0a0 !important;
    --resize-background-color: #141414 !important;
    --resize-hover-icon-color: #ffffff !important;
    --resize-hover-background-color: #4285f4 !important;
    --count-background-color: rgba(200, 200, 200, 0.1) !important;
    --heading-border-color: #333333 !important;
    --blockquote-color: #9a9a9a !important;
    --ir-heading-color: #bb86fc !important;
    --ir-title-color: #a0a0a0 !important;
    --ir-bi-color: #82aaff !important;
    --ir-link-color: #89ddff !important;
    --ir-bracket-color: #82aaff !important;
    --ir-paren-color: #89ddff !important;
}

/* Force background on elements */
.vditor-toolbar,
.vditor-reset,
pre.vditor-reset {
    background-color: var(--toolbar-background-color) !important;
    color: var(--textarea-text-color) !important;
}
```