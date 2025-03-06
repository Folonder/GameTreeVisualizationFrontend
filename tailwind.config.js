// tailwind.config.js
const { TREE_CONSTANTS } = require('./src/components/tree/constants');

module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                tree: {
                    normal: TREE_CONSTANTS.COLORS.STROKE.NORMAL,
                    expanded: TREE_CONSTANTS.COLORS.STROKE.EXPANDED,
                    hidden: TREE_CONSTANTS.COLORS.STROKE.HAS_HIDDEN,
                    limited: TREE_CONSTANTS.COLORS.STROKE.DEPTH_LIMITED,
                    filtered: TREE_CONSTANTS.COLORS.STROKE.FILTERED
                }
            },
            spacing: {
                '128': '32rem',
                '144': '36rem',
            },
            minHeight: {
                'screen-75': '75vh'
            },
            scale: {
                '200': '2',
                '250': '2.5',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-up': 'slideUp 0.2s ease-out',
            },
            transitionTimingFunction: {
                'tree': TREE_CONSTANTS.ANIMATION.EASING,
            },
            zIndex: {
                'tooltip': 100,
                'modal': 200,
                'context-menu': 300,
            }
        },
    },
    plugins: [],
}