using System;
using System.Net;
using Newtonsoft.Json.Linq;

namespace RevitMCPPlugin.Core
{
    /// <summary>
    /// Checks for updates via the GitHub Releases API.
    /// Configure GITHUB_OWNER and GITHUB_REPO to point to your repository.
    /// </summary>
    public class UpdateChecker
    {
        // ===== CONFIGURE THESE FOR YOUR GITHUB REPO =====
        private const string GITHUB_OWNER = "YOUR_GITHUB_USERNAME";
        private const string GITHUB_REPO = "revit-mcp";
        // ================================================

        private static readonly string API_URL = 
            $"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/releases/latest";

        public UpdateInfo CheckForUpdate()
        {
            try
            {
                using (var client = new WebClient())
                {
                    client.Headers.Add("User-Agent", "RevitMCP-UpdateChecker");
                    client.Headers.Add("Accept", "application/vnd.github.v3+json");

                    var json = client.DownloadString(API_URL);
                    var release = JObject.Parse(json);

                    var latestTag = release["tag_name"]?.ToString()?.TrimStart('v') ?? "0.0.0";
                    var changelog = release["body"]?.ToString() ?? "No changelog available";
                    var htmlUrl = release["html_url"]?.ToString() ?? "";

                    // Find the .exe asset
                    var downloadUrl = htmlUrl;
                    var assets = release["assets"] as JArray;
                    if (assets != null)
                    {
                        foreach (JObject asset in assets)
                        {
                            var name = asset["name"]?.ToString() ?? "";
                            if (name.EndsWith(".exe") || name.EndsWith(".zip"))
                            {
                                downloadUrl = asset["browser_download_url"]?.ToString() ?? htmlUrl;
                                break;
                            }
                        }
                    }

                    var currentVersion = new Version(Application.Version);
                    var latestVersion = new Version(latestTag);

                    return new UpdateInfo
                    {
                        UpdateAvailable = latestVersion > currentVersion,
                        LatestVersion = $"v{latestTag}",
                        Changelog = changelog.Length > 500 ? changelog.Substring(0, 500) + "..." : changelog,
                        DownloadUrl = downloadUrl
                    };
                }
            }
            catch (Exception ex)
            {
                Logger.LogError("Update check failed", ex);
                throw new Exception($"Could not check for updates: {ex.Message}");
            }
        }
    }

    public class UpdateInfo
    {
        public bool UpdateAvailable { get; set; }
        public string LatestVersion { get; set; } = "";
        public string Changelog { get; set; } = "";
        public string DownloadUrl { get; set; } = "";
    }
}
