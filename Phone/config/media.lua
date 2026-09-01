Config.Media = {
    GiphyApiKey = "",
    GifPageSize = 24,
    GifRating = "pg-13",
    UrlMaxLength = 2048,
    AllowedGifHosts = { "giphy.com" },
    FiveManage = {
        ApiKey = "",
        BaseUrl = "https://api.fivemanage.com/api/v3/file",
        RequestTimeoutMs = 10000,
        UploadTimeoutMs = 25000,
    },
    Import = {
        Enabled = true,
        PageSize = 30,
        MaxSelection = 10,
        MaxPhotoBytes = 15 * 1024 * 1024,
        MaxVideoBytes = 150 * 1024 * 1024,
        RevalidateAfterSeconds = 3600,
        ListActionsPerMinute = 60,
        ImportActionsPerMinute = 20,
        CandidateTtlSeconds = 300,
        ManifestCacheSeconds = 30,
        ManifestMaxBytes = 2 * 1024 * 1024,
        ManifestMaxItems = 5000,
        Websites = {
            {
                Id = "fivemanage",
                Label = "FiveManage",
                Enabled = true,
                Adapter = "fivemanage",
                Path = "agent_phone/imports",
                MediaTypes = { "photo", "video" },
                AllowedMediaHosts = { "fivemanage.com" },
            },
        },
    },
    Wallpaper = {

        CustomUploadEnabled = true,
    },
    Photo = {
        Encoding = "jpg",
        Quality = 0.95,
    },
    Video = {
        BitrateKbps = 1500,
    },
    UploadSessionTimeoutMs = 60000,
    PageSize = 30,
}