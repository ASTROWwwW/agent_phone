AgentPhoneImei = {}

function AgentPhoneImei.CheckDigit(body)
    if type(body) ~= "string" or not body:match("^%d%d%d%d%d%d%d%d%d%d%d%d%d%d$") then
        return nil
    end

    local sum = 0
    for index = 1, 14 do
        local digit = tonumber(body:sub(index, index))
        if index % 2 == 0 then
            digit = digit * 2
            if digit > 9 then
                digit = digit - 9
            end
        end
        sum = sum + digit
    end
    return tostring((10 - (sum % 10)) % 10)
end

function AgentPhoneImei.FromEntropy(entropy)
    if type(entropy) ~= "string" then
        return nil
    end

    local digits = {}
    for character in entropy:lower():gmatch("[0-9a-f]") do
        digits[#digits + 1] = tostring(tonumber(character, 16) % 10)
        if #digits == 14 then
            break
        end
    end
    if #digits ~= 14 then
        return nil
    end

    local body = table.concat(digits)
    return body .. AgentPhoneImei.CheckDigit(body)
end

function AgentPhoneImei.IsValid(value)
    if type(value) ~= "string" or not value:match("^%d%d%d%d%d%d%d%d%d%d%d%d%d%d%d$") then
        return false
    end
    return value:sub(15, 15) == AgentPhoneImei.CheckDigit(value:sub(1, 14))
end

function AgentPhoneImei.Reserve(entropy_factory, reserve)
    for _ = 1, 20 do
        local imei = AgentPhoneImei.FromEntropy(entropy_factory())
        if imei and reserve(imei) then
            return imei
        end
    end

    return nil
end
