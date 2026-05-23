/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    let collection = new Collection({
        type: "auth",
        name: "employees",
        listRule: "@request.auth.collectionName = \"admins\"",
        viewRule: "id = @request.auth.id || @request.auth.collectionName = \"admins\"",
        createRule: null,
        updateRule: "id = @request.auth.id || @request.auth.collectionName = \"admins\"",
        deleteRule: "@request.auth.collectionName = \"admins\"",
        authRule: "",
        fields: [
        {
                "hidden": false,
                "id": "text0578699676",
                "name": "name",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "text",
                "autogeneratePattern": "",
                "max": 0,
                "min": 0,
                "pattern": ""
        },
        {
                "hidden": false,
                "id": "text1801844241",
                "name": "phone",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "text",
                "autogeneratePattern": "",
                "max": 0,
                "min": 0,
                "pattern": ""
        },
        {
                "hidden": false,
                "id": "number5020601341",
                "name": "daily_wage",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "number",
                "max": null,
                "min": 0,
                "onlyInt": false
        },
        {
                "hidden": false,
                "id": "number8381440794",
                "name": "hourly_rate",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "number",
                "max": null,
                "min": 0,
                "onlyInt": false
        },
        {
                "hidden": false,
                "id": "date7143605150",
                "name": "joining_date",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "date",
                "max": "",
                "min": ""
        },
        {
                "hidden": false,
                "id": "select2780536938",
                "name": "status",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "select",
                "maxSelect": 1,
                "values": [
                        "active",
                        "inactive"
                ]
        },
        {
                "hidden": false,
                "id": "file2839090506",
                "name": "profile_photo",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "file",
                "maxSelect": 1,
                "maxSize": 20971520,
                "mimeTypes": [
                        "image/jpeg",
                        "image/png",
                        "image/gif",
                        "image/webp"
                ],
                "thumbs": []
        }
],
        authAlert: { enabled: false },
    })

    try {
        app.save(collection)
    } catch (e) {
        if (e.message.includes("Collection name must be unique")) {
            console.log("Collection already exists, skipping")
            return
        }
        throw e
    }
}, (app) => {
    try {
        let collection = app.findCollectionByNameOrId("employees")
        app.delete(collection)
    } catch (e) {
        if (e.message.includes("no rows in result set")) {
            console.log("Collection not found, skipping revert");
            return;
        }
        throw e;
    }
})
