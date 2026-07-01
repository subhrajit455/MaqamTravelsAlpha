const {Traveller }= require('./traveller.model');
const { AppError } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');

const createTraveller = async (userId,travellerData) => {
     if (travellerData.isDefault) {
        await Traveller.updateMany(
            { userId },
            { isDefault: false }
        );
    }
    const traveller = new Traveller({
        userId,
        ...travellerData
    });

    await traveller.save();
    logger.info('Traveller created successfully');
    return traveller;
  
};

const getTravellersByUserId = async (userId) => {
    const travellers = await Traveller.find({ userId });
    if(!travellers || travellers.length === 0) {
        throw new AppError('No travellers found for this user', 404);
    }
    logger.info(`Retrieved ${travellers.length} travellers for user ${userId}`);
    return travellers;
}   
    
const getTravellerById = async (userId, travellerId) => {
    const traveller = await Traveller.findById({ _id: travellerId, userId });
    if (!traveller) {
        throw new AppError('Traveller not found', 404);
    }
    logger.info(`Traveller ${traveller._id} retrieved`);
    return traveller;
}       


const updateTraveller = async (userId, travellerId, travellerData) => {
    const traveller = await Traveller.findById({ _id: travellerId, userId });
    if (!traveller) {
        throw new AppError('Traveller not found', 404);
    }
    Object.assign(traveller, travellerData);
    await traveller.save();
    logger.info(`Traveller ${traveller._id} updated`);
    return traveller;
}

const deleteTraveller = async (userId, travellerId) => {
    const traveller = await Traveller.findById({ _id: travellerId, userId });
    if (!traveller) {
        throw new AppError('Traveller not found', 404);
    }   
    const deletedTraveller = await Traveller.findByIdAndDelete(travellerId);
    logger.info(`Traveller ${deletedTraveller._id} deleted`);
    return deletedTraveller;
}
module.exports = {
    createTraveller,
    getTravellersByUserId,
    getTravellerById,
    updateTraveller,
    deleteTraveller
};