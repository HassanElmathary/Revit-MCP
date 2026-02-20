using System;
using System.IO;
using System.Reflection;
using System.Windows.Media.Imaging;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;

namespace RevitMCPPlugin.Core
{
    /// <summary>
    /// Main entry point for the Revit MCP Plugin.
    /// Registers the ribbon panel with Start/Stop service and Settings buttons.
    /// </summary>
    public class Application : IExternalApplication
    {
        public static UIControlledApplication? UiApp { get; private set; }
        public static UIApplication? ActiveUIApp { get; set; }
        private static SocketService? _socketService;
        private static ExternalEventManager? _eventManager;

        public static SocketService? SocketServiceInstance => _socketService;
        public static ExternalEventManager? EventManagerInstance => _eventManager;

        public static string Version => "1.0.0";

        public Result OnStartup(UIControlledApplication application)
        {
            UiApp = application;

            try
            {
                // Create ribbon panel
                var panel = application.CreateRibbonPanel("Revit MCP");

                // MCP Service Toggle button
                var toggleBtnData = new PushButtonData(
                    "MCPToggle",
                    "Start MCP\nService",
                    Assembly.GetExecutingAssembly().Location,
                    "RevitMCPPlugin.Commands.ToggleServiceCommand"
                );
                toggleBtnData.ToolTip = "Start or stop the MCP service for AI integration";
                var toggleBtn = panel.AddItem(toggleBtnData) as PushButton;

                // Settings button
                var settingsBtnData = new PushButtonData(
                    "MCPSettings",
                    "Settings",
                    Assembly.GetExecutingAssembly().Location,
                    "RevitMCPPlugin.Commands.SettingsCommand"
                );
                settingsBtnData.ToolTip = "Configure MCP connection settings";
                panel.AddItem(settingsBtnData);

                // Check Updates button
                var updateBtnData = new PushButtonData(
                    "MCPUpdate",
                    "Check\nUpdates",
                    Assembly.GetExecutingAssembly().Location,
                    "RevitMCPPlugin.Commands.CheckUpdateCommand"
                );
                updateBtnData.ToolTip = "Check for plugin updates on GitHub";
                panel.AddItem(updateBtnData);

                // Initialize the external event manager
                _eventManager = new ExternalEventManager();

                Logger.Log("Revit MCP Plugin started successfully");
                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                Logger.LogError("Failed to start Revit MCP Plugin", ex);
                return Result.Failed;
            }
        }

        public Result OnShutdown(UIControlledApplication application)
        {
            try
            {
                _socketService?.Stop();
                Logger.Log("Revit MCP Plugin shut down");
                return Result.Succeeded;
            }
            catch (Exception ex)
            {
                Logger.LogError("Error during shutdown", ex);
                return Result.Failed;
            }
        }

        public static void StartService(UIApplication uiApp)
        {
            ActiveUIApp = uiApp;
            if (_socketService == null)
            {
                _socketService = new SocketService(8080, _eventManager!);
            }
            _socketService.Start();
            Logger.Log("MCP Service started on port 8080");
        }

        public static void StopService()
        {
            _socketService?.Stop();
            Logger.Log("MCP Service stopped");
        }

        public static bool IsServiceRunning => _socketService?.IsRunning ?? false;
    }
}
