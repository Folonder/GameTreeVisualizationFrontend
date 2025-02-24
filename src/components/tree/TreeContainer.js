import React from 'react';
import TreeUpload from './TreeUpload';
import TreeView from './TreeView';
import NoDataMessage from './NoDataMessage';
import StatusMessage from '../common/StatusMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import useTreeData from '../../hooks/useTreeData';

const TreeContainer = () => {
    const { data, loading, error, uploadTree } = useTreeData();

    if (error) {
        return <StatusMessage type="error" message={error} />;
    }

    return (
        <div className="space-y-4">
            <TreeUpload onUpload={uploadTree} />
            
            {loading ? (
                <div className="py-8">
                    <LoadingSpinner />
                </div>
            ) : data ? (
                <TreeView data={data} />
            ) : (
                <NoDataMessage />
            )}
        </div>
    );
};

export default TreeContainer;