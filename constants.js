const mongodbAddress = 'mongodb://tpan496:trollNoob971006!@exp-server-shard-00-00-8ecae.mongodb.net:27017,exp-server-shard-00-01-8ecae.mongodb.net:27017,exp-server-shard-00-02-8ecae.mongodb.net:27017/exp-server?ssl=true&replicaSet=exp-server-shard-0&authSource=admin'
const forceSyncThreshold = 3; // synchronize check frequency
var whitespacePattern = /^\s*$/;
const YT_VIDEO_UNSTARTED = -1;
const YT_VIDEO_ENDED = 0;
const YT_VIDEO_PLAYING = 1;
const YT_VIDEO_PAUSED = 2;