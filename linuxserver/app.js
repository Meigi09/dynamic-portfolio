const express = require('express');
const app = express();
const userRoutes = require('./routes/useroutes');
const cors = require('cors');

app.use(cors({

}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(userRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});