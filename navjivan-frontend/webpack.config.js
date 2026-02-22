const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
    const config = await createExpoWebpackConfigAsync(
        {
            ...env,
            babel: {
                dangerouslyAddModulePathsToTranspile: ['@expo/vector-icons'],
            },
        },
        argv
    );


    config.resolve.alias = {
        ...config.resolve.alias,
        './geofencing': './geofencing.web',
    };

    return config;
};
