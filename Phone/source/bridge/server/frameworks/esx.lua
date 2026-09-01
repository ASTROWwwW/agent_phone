if Bridge.Framework.Name ~= "esx" then
    return
end

local ESX_RESOURCE = Bridge.Framework.Resource

if not ESX_RESOURCE or GetResourceState(ESX_RESOURCE) ~= "started" then
    error(("[agent_phone] ESX is configured, but resource '%s' is not started."):format(tostring(ESX_RESOURCE)))
end

local ESX = exports[ESX_RESOURCE]:getSharedObject()

if type(ESX) ~= "table" or type(ESX.GetPlayerFromId) == "nil" then
    error(("[agent_phone] Resource '%s' returned an unusable ESX object. A read-only metatable proxy does not survive the FiveM export boundary; the provider must return the raw table."):format(ESX_RESOURCE))
end

local function get_player(source)
    return ESX.GetPlayerFromId(source)
end

function Bridge.Framework.GetPlayers()
    local players = {}
    for _, player in pairs(ESX.GetExtendedPlayers()) do
        players[#players + 1] = player.source
    end
    return players
end

function Bridge.Framework.GetIdentifier(source)
    local player = get_player(source)
    return player and player.identifier or nil
end

function Bridge.Framework.HasAdminGroup(source, groups)
    local player = get_player(source)
    if not player then
        return false
    end
    local player_group = player.getGroup()
    for _, group in ipairs(groups) do
        if player_group == group then
            return true
        end
    end
    return false
end

function Bridge.Framework.GetMoney(source, account)
    local player = get_player(source)
    if not player then
        return nil
    end
    if account == "cash" then
        account = "money"
    end
    local account_data = player.getAccount(account)
    return account_data and account_data.money or nil
end

function Bridge.Framework.AddMoney(source, account, amount)
    local player = get_player(source)
    if not player then
        return false
    end
    if account == "cash" then
        account = "money"
    end
    player.addAccountMoney(account, amount)
    return true
end

function Bridge.Framework.RemoveMoney(source, account, amount)
    local player = get_player(source)
    if not player then
        return false
    end
    if account == "cash" then
        account = "money"
    end
    local account_data = player.getAccount(account)
    if not account_data or account_data.money < amount then
        return false
    end
    player.removeAccountMoney(account, amount)
    return true
end

function Bridge.Framework.GetFirstname(source)
    local player = get_player(source)
    return player and player.get("firstName") or nil
end

function Bridge.Framework.GetLastname(source)
    local player = get_player(source)
    return player and player.get("lastName") or nil
end

function Bridge.Framework.GetCharacterName(source)
    local player = get_player(source)
    if not player then
        return nil, nil
    end

    local first_name = player.get and player.get("firstName") or nil
    local last_name = player.get and player.get("lastName") or nil
    if first_name and first_name ~= "" and last_name and last_name ~= "" then
        return first_name, last_name
    end

    local identifier = player.identifier
    if not identifier then
        return first_name, last_name
    end

    local rows = Bridge.Database.Query(
        "SELECT `firstname`, `lastname` FROM `users` WHERE `identifier` = ? LIMIT 1",
        { identifier }
    )
    local identity = rows[1]
    if not identity then
        return first_name, last_name
    end

    return identity.firstname or first_name, identity.lastname or last_name
end

function Bridge.Framework.GetBirthdate(source)
    local player = get_player(source)
    return player and (player.get("dateofbirth") or player.get("dob")) or nil
end

local function job_payload(job)
    if not job then
        return { name = "", label = "", grade = 0, gradeLabel = "", onDuty = false }
    end
    return {
        name = job.name or "",
        label = job.label or "",
        grade = tonumber(job.grade) or 0,
        gradeLabel = job.grade_label or job.label or "",
        onDuty = job.onDuty == true,
    }
end

function Bridge.Framework.GetJob2(source)
    local player = get_player(source)
    return job_payload(player and player.getJob2 and player.getJob2())
end

function Bridge.Framework.GetJob(source)
    local player = get_player(source)
    local job = player and player.getJob()
    if not job then
        return { name = "", label = "", grade = 0, gradeLabel = "", onDuty = false }
    end
    return {
        name = job.name or "",
        label = job.label or "",
        grade = tonumber(job.grade) or 0,
        gradeLabel = job.grade_label or job.label or "",
        onDuty = true,
    }
end

function Bridge.Framework.RegisterUsableItem(item_name, callback)
    ESX.RegisterUsableItem(item_name, callback)
    return true
end
