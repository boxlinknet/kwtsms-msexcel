// src/commands/commands.ts
// Ribbon button handler. Opens the task pane when clicked.
// Related: manifest.xml

Office.onReady(() => {
  // Nothing to initialize for commands
});

function showTaskpane(event: Office.AddinCommands.Event): void {
  Office.addin.showAsTaskpane();
  event.completed();
}

// Register the function with Office
(globalThis as any).showTaskpane = showTaskpane;
