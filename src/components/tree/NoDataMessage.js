import React from 'react';
import Card from '../common/Card';

const NoDataMessage = () => {
    return (
        <Card>
            <div className="text-center py-8">
                <p className="text-gray-500">
                    Upload a JSON file to visualize the tree
                </p>
            </div>
        </Card>
    );
};

export default NoDataMessage;