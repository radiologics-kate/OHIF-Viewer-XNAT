const namespace = function namespace(name) {
    const prefix = `${name}.`;

    return {
        get: function (key) {
            return Session.get(prefix + key);
        },
        set: function (key, value) {
            return Session.set(prefix + key, value);
        },
        setDefault: function (key, value) {
            return Session.setDefault(prefix + key, value);
        },
        equals: function (key, value) {
            return Session.equals(prefix + key, value);
        },
        namespace: function(name) {
            return namespace(prefix + name);
        }
    };
};

_.extend(Session, {
    namespace
});


const icrXnatRoiSession = Session.namespace("ICR_XNAT_ROI");

export { icrXnatRoiSession };
