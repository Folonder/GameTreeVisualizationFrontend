// src/hooks/useTreeFiltering.js
import { useState, useCallback, useEffect } from 'react';
import * as d3 from 'd3';
import { getNodeIdentifier, calculateNodePercentage } from '../utils/treeUtils';

export const useTreeFiltering = (data) => {
    const [filters, setFilters] = useState({
        maxDepth: null,
        depthFilters: new Map(),
        isFiltersApplied: false
    });
    
    const [hiddenChildrenIds, setHiddenChildrenIds] = useState(new Set());
    const [filteredChildrenIds, setFilteredChildrenIds] = useState(new Set());
    const [overrideFilterIds, setOverrideFilterIds] = useState(new Set());

    const isFilteredByFilters = useCallback((node) => {
        if (!filters.isFiltersApplied) return false;
        
        if (filters.maxDepth !== null && node.depth > filters.maxDepth) {
            return true;
        }
        
        const thresholdForThisDepth = filters.depthFilters.get(node.depth);
        if (thresholdForThisDepth && thresholdForThisDepth > 0) {
            const nodePercentage = calculateNodePercentage(node);
            
            if (nodePercentage < thresholdForThisDepth) {
                return true;
            }
        }
        
        let parent = node.parent;
        while (parent) {
            if (overrideFilterIds.has(getNodeIdentifier(parent))) {
                return false;
            }
            
            const parentThreshold = filters.depthFilters.get(parent.depth);
            if (parentThreshold && parentThreshold > 0) {
                const parentPercentage = calculateNodePercentage(parent);
                if (parentPercentage < parentThreshold) {
                    return true;
                }
            }
            
            parent = parent.parent;
        }
        
        return false;
    }, [filters, overrideFilterIds]);

    const toggleNodeExpansion = useCallback((node) => {
        if (!node) return;
        
        const nodeId = getNodeIdentifier(node);
        
        setHiddenChildrenIds(prev => {
            const next = new Set([...prev]);
            
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
                
                const addDescendantsToHidden = (parentNode) => {
                    if (parentNode.children && parentNode.children.length > 0) {
                        parentNode.children.forEach(child => {
                            const childId = getNodeIdentifier(child);
                            next.add(childId);
                            
                            addDescendantsToHidden(child);
                        });
                    }
                };
                
                addDescendantsToHidden(node);
            }
            
            return next;
        });
    }, []);

    const toggleFilterOverride = useCallback((node) => {
        if (!node) return;
        
        const nodeId = getNodeIdentifier(node);
        
        setOverrideFilterIds(prev => {
            const next = new Set([...prev]);
            
            if (next.has(nodeId)) {
                next.delete(nodeId);
                
                const removeDescendantOverrides = (parentNode) => {
                    if (parentNode.children && parentNode.children.length > 0) {
                        parentNode.children.forEach(child => {
                            const childId = getNodeIdentifier(child);
                            if (next.has(childId)) {
                                next.delete(childId);
                            }
                            removeDescendantOverrides(child);
                        });
                    }
                };
                
                removeDescendantOverrides(node);
            } else {
                next.add(nodeId);
            }
            
            return next;
        });
    }, []);

    // Function to update filteredChildrenIds
    const updateFilteredChildrenIds = useCallback((treeData, currentFilters) => {
        const hierarchy = d3.hierarchy(treeData);
        const allNodes = hierarchy.descendants();
        const newFilteredChildrenIds = new Set();
        const defaultExpandedNodesIds = new Set();
        
        // Find visible nodes to keep expanded
        const visibleNodes = allNodes.filter((node) => {
            if (currentFilters.maxDepth !== null && node.depth > currentFilters.maxDepth) {
                return false;
            }
            
            const threshold = currentFilters.depthFilters.get(node.depth);
            if (threshold && threshold > 0) {
                const nodePercentage = calculateNodePercentage(node);
                if (nodePercentage < threshold) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Create paths to visible nodes
        visibleNodes.forEach(node => {
            let current = node.parent;
            while (current) {
                defaultExpandedNodesIds.add(getNodeIdentifier(current));
                current = current.parent;
            }
        });
        
        // Mark nodes with filtered children
        allNodes.forEach(node => {
            if (node.children && node.children.length > 0) {
                const hasFilteredChildren = node.children.some(child => {
                    if (currentFilters.maxDepth !== null && child.depth > currentFilters.maxDepth) {
                        return true;
                    }
                    
                    const threshold = currentFilters.depthFilters.get(child.depth);
                    if (threshold && threshold > 0) {
                        const childPercentage = calculateNodePercentage(child);
                        return childPercentage < threshold;
                    }
                    
                    return false;
                });
                
                if (hasFilteredChildren) {
                    newFilteredChildrenIds.add(getNodeIdentifier(node));
                }
            }
        });
        
        // Create overrides for nodes that should remain expanded
        const newOverrideFilterIds = new Set();
        defaultExpandedNodesIds.forEach(nodeId => {
            if (newFilteredChildrenIds.has(nodeId)) {
                newOverrideFilterIds.add(nodeId);
            }
        });
        
        setFilteredChildrenIds(newFilteredChildrenIds);
        setOverrideFilterIds(newOverrideFilterIds);
    }, []);

    const applyFilters = useCallback((newFilters) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters,
            isFiltersApplied: true
        }));
        
        setOverrideFilterIds(new Set());
        
        if (data) {
            updateFilteredChildrenIds(data, newFilters);
        }
    }, [data, updateFilteredChildrenIds]);

    const resetFilters = useCallback(() => {
        setFilters({
            maxDepth: null,
            depthFilters: new Map(),
            isFiltersApplied: false
        });
        setHiddenChildrenIds(new Set());
        setFilteredChildrenIds(new Set());
        setOverrideFilterIds(new Set());
    }, []);

    const shouldShowNode = useCallback((node) => {
        let current = node.parent;
        
        while (current) {
            const currentId = getNodeIdentifier(current);
            
            if (hiddenChildrenIds.has(currentId) && !overrideFilterIds.has(currentId)) {
                return false;
            }
            
            if (filteredChildrenIds.has(currentId) && !overrideFilterIds.has(currentId)) {
                return false;
            }
            
            current = current.parent;
        }
        
        if (isFilteredByFilters(node)) {
            if (node.parent && overrideFilterIds.has(getNodeIdentifier(node.parent))) {
                return true;
            }
            return false;
        }
        
        return true;
    }, [filteredChildrenIds, overrideFilterIds, isFilteredByFilters, hiddenChildrenIds]);

    // Update filteredChildrenIds when filters or data change
    useEffect(() => {
        if (!data || !filters.isFiltersApplied) return;
        
        const hierarchy = d3.hierarchy(data);
        const allNodes = hierarchy.descendants();
        const newFilteredChildrenIds = new Set();
            
        allNodes.forEach(node => {
            if (node.children && node.children.length > 0) {
                const hasFilteredChildren = node.children.some(child => 
                    isFilteredByFilters(child));
                
                if (hasFilteredChildren) {
                    newFilteredChildrenIds.add(getNodeIdentifier(node));
                }
            }
        });
        
        setFilteredChildrenIds(newFilteredChildrenIds);
        
    }, [data, isFilteredByFilters, filters]);

    return {
        filters,
        hiddenChildrenIds,
        filteredChildrenIds,
        overrideFilterIds,
        isFilteredByFilters,
        toggleNodeExpansion,
        toggleFilterOverride,
        applyFilters,
        resetFilters,
        shouldShowNode
    };
};