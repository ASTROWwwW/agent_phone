local required_methods = {
    "GetResourceName",
    "GetSlot",
    "GetSlotsWithItem",
    "SetSlotMetadata",
    "CanCarryItem",
    "AddItem",
    "RemoveItem",
    "RegisterUsableItem",
}

for _, method_name in ipairs(required_methods) do
    if type(Bridge.Inventory[method_name]) ~= "function" then
        local contract_error = ("[agent_phone] Le pont ox_inventory n'expose pas la methode requise '%s'.")
            :format(method_name)
        Bridge.Inventory[method_name] = function()
            error(contract_error, 2)
        end
    end
end
