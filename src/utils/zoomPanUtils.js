// src/utils/zoomPanUtils.js
import * as d3 from 'd3';
import { TREE_CONSTANTS } from '../components/tree/constants';

export const setupGraphPan = (svg, mainGroup, nodeCount, savedTransform, isTransformSet, activeTransformRef, updateTransform) => {
    const initialTransform = determineInitialTransform(savedTransform, activeTransformRef, nodeCount);
    activeTransformRef.current = initialTransform;

    const zoom = createZoomBehavior(mainGroup, activeTransformRef, updateTransform, nodeCount);
    
    svg.call(zoom);
    
    if (!isTransformSet.current) {
        svg.call(zoom.transform, initialTransform);
        isTransformSet.current = true;
    } else {
        applyTransformDirectly(mainGroup, initialTransform);
    }
    
    return () => {
        svg.on('.zoom', null);
    };
};

function determineInitialTransform(savedTransform, activeTransformRef, nodeCount) {
    if (activeTransformRef.current) {
        return activeTransformRef.current;
    } 
    
    if (savedTransform) {
        return savedTransform;
    }
    
    const initialScale = determineInitialScale(nodeCount);
    const [initialX, initialY] = determineInitialTranslation(nodeCount);
    return d3.zoomIdentity.translate(initialX, initialY).scale(initialScale);
}

function determineInitialScale(nodeCount) {
    if (nodeCount < TREE_CONSTANTS.ADAPTIVE_SCALING.TINY_TREE.NODE_COUNT) {
        return 0.85;
    }
    
    if (nodeCount < TREE_CONSTANTS.ADAPTIVE_SCALING.SMALL_TREE.NODE_COUNT) {
        return 0.7;
    }
    
    if (nodeCount < 200) {
        return 0.55;
    }
    
    if (nodeCount < 500) {
        return 0.45;
    }
    
    return 0.35;
}

function determineInitialTranslation(nodeCount) {
    if (nodeCount < TREE_CONSTANTS.ADAPTIVE_SCALING.TINY_TREE.NODE_COUNT) {
        return [100, Math.min(200, window.innerHeight / 4)];
    }
    
    if (nodeCount < TREE_CONSTANTS.ADAPTIVE_SCALING.SMALL_TREE.NODE_COUNT) {
        return [80, Math.min(150, window.innerHeight / 5)];
    }
    
    return [50, 50];
}

function createZoomBehavior(mainGroup, activeTransformRef, updateTransform, nodeCount) {
    const minScale = TREE_CONSTANTS.LAYOUT.ZOOM.MIN * 0.8;
    const maxScale = nodeCount < TREE_CONSTANTS.ADAPTIVE_SCALING.SMALL_TREE.NODE_COUNT ? 
        TREE_CONSTANTS.LAYOUT.ZOOM.MAX * 2 : 
        TREE_CONSTANTS.LAYOUT.ZOOM.MAX;
    
    const userInteractionRef = { current: false };
    
    return d3.zoom()
        .scaleExtent([minScale, maxScale])
        .on('start', () => {
            userInteractionRef.current = true;
        })
        .on('zoom', (event) => {
            applyTransformDirectly(mainGroup, event.transform);
            adjustElementScaling(mainGroup, event.transform);
            
            activeTransformRef.current = event.transform;
            
            if (event.sourceEvent) {
                updateTransform(event.transform);
            }
        })
        .on('end', () => {
            userInteractionRef.current = false;
        });
}

function applyTransformDirectly(group, transform) {
    group.style('transform', `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`);
}

function adjustElementScaling(group, transform) {
    const inverseScale = 1 / transform.k;
    
    group.selectAll('.percentage-text, .plus-sign')
        .style('transform', `scale(${inverseScale})`);
    
    group.selectAll('.percentage-bg')
        .style('transform', `scale(${inverseScale})`);
    
    if (transform.k > 1.2) {
        group.selectAll('.percentage-text')
            .style('font-size', `${8 * inverseScale}px`);
        
        group.selectAll('.percentage-bg')
            .attr('width', 20 * inverseScale)
            .attr('height', 12 * inverseScale);
    }
}