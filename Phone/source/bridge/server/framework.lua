-- ESX Legacy est parfois publie sous un autre nom de ressource. On resout le
-- nom reel plutot que de coder 'es_extended' en dur, sinon la detection echoue
-- sur une base renommee et la ressource s arrete au chargement.
local ESX_RESOURCES = { "es_extended", "Agent" }

local function resolve_esx_resource()
    for _, resource_name in ipairs(ESX_RESOURCES) do
        if GetResourceState(resource_name) == "started" then
            return resource_name
        end
    end
    return nil
end

local configured_framework = Config.Bridge.Framework
local esx_resource = resolve_esx_resource()

if configured_framework == "auto" then
    configured_framework = esx_resource and "esx" or configured_framework
end

if configured_framework ~= "esx" then
    error(("[agent_phone] Unsupported or unavailable framework '%s'. This build only ships the ESX adapter."):format(tostring(configured_framework)))
end

if not esx_resource then
    error(("[agent_phone] ESX is configured, but none of these resources is started: %s."):format(table.concat(ESX_RESOURCES, ", ")))
end

Bridge.Framework.Name = configured_framework
Bridge.Framework.Resource = esx_resource

function Bridge.Framework.GetName()
    return Bridge.Framework.Name
end

function Bridge.Framework.HasPermission(source, permission)
    if type(permission) ~= "string" or permission == "" then
        error("[agent_phone] Permission identifiers must be non-empty strings.")
    end

    local groups = Config.CommandPermissions[permission]
    if type(groups) ~= "table" or #groups == 0 then
        local message = "[agent_phone] Config.CommandPermissions.%s must contain at least one group."
        error(message:format(permission))
    end
    for index, group in ipairs(groups) do
        if type(group) ~= "string" or group == "" then
            local message = "[agent_phone] Config.CommandPermissions.%s[%s] must be a non-empty string."
            error(message:format(permission, index))
        end
    end

    return Bridge.Framework.HasAdminGroup(source, groups)
end
