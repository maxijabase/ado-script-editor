# Store listing (Chrome Web Store and Edge Add-ons)

## Name
Script Editor for Azure DevOps

## Summary (132 characters max)
A real code editor for inline scripts in Azure DevOps pipelines: syntax highlighting, autocomplete and full screen.

## Category
Developer Tools

## Description
Stop editing pipeline scripts in a plain text box.

Script Editor for Azure DevOps replaces the "Inline Script" and "Script" fields of classic pipeline tasks with a proper code editor, right where they are.

• Syntax highlighting for PowerShell, Bash and Python, picked automatically from the task (Azure PowerShell, PowerShell, Bash, Command line, Python, Azure CLI)
• Autocomplete for keywords, common cmdlets and commands, words already in your script, and logging command snippets (##vso[task.setvariable], ##[group], ##[error]…)
• Pipeline variables like $(Build.BuildId) stand out from the code
• Full-screen editing for long scripts
• Character counter that warns before you hit the field's 5,000-character limit
• Line numbers, code folding, bracket matching, search and replace, multiple cursors, Tab to indent
• Follows Azure DevOps' light or dark theme; font size and line wrapping are configurable
• One click brings back the original text box

Works in classic release pipelines, build pipelines and task groups on dev.azure.com and *.visualstudio.com.

Private by design: no data collection, no network requests, no remote code.

Open source (MIT): https://github.com/maxijabase/ado-script-editor

Not affiliated with or endorsed by Microsoft. Azure DevOps is a trademark of Microsoft Corporation.

## Chrome Web Store: privacy tab

Single purpose:
Replaces the script text boxes in Azure DevOps pipeline tasks with a code editor.

Permission justifications:
- storage: Saves the user's editor preferences (theme, font size, line wrapping).
- Host permissions (dev.azure.com, *.visualstudio.com): The content script must run on Azure DevOps pages to find the pipeline task script fields and show the code editor in their place.
- Remote code: No. All code ships in the package.

Data usage: collects none of the listed data types. Certify all three disclosures.

Privacy policy URL: https://github.com/maxijabase/ado-script-editor/blob/main/PRIVACY.md

## Assets
- Icon 128×128: icons/icon-128.png
- Edge logo 300×300: resize store/icon-512.png
- Screenshots: 1280×800 (or 640×400), 1 to 5. Take them in a real pipeline: the editor in a task, full screen, and the autocomplete open.
