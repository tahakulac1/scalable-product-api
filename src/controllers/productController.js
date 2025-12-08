let products = [];

exports.createProduct = (req, res) => {
    try {
        const {name, price } = req.body;

     if(!name || !price) {
        return res.status(400).json({message: "İsim ve Fiyat zorunlu"});

     }

     const newProduct = {
        id: products.length +1,
        name,
        price
     };
     products.push(newProduct);
     return res.status(201).json({
          message: "Ürün başarıyla oluşturuldu.",
          product: newProduct

     });
    
    }catch (err) {
        console.error('Ürün oluşturma hatası:', err);
        return res.status(500).json({message: "Sunucu hatası"});
    }

  
};

exports.getProducts = (req, res) => {
    try{
        return res.json({
            message: "Ürün Listesi.",
            products: products
        });
    }catch (err) {
        console.error("Ürün listeleme hatası.");
        return res.status(500).json({ message: "Sunucu hatası."});
    }
};

exports.getProductById = (req, res) => {
    try {
        const {id} = req.params;
        const product = products.find(p=> p.id === Number(id));

        if (!product) {
            return res.status(404).json({
                message: "Ürün bulunamadı."
            });
        }
        return res.json({
            message: "Ürün bulundu.",
            product
        });


    }catch (err) {
        console.error('Ürün bulma hatası:', err);
        return res.status(500).json({
            message: "Sunucu hatası."
        });
    }
};

exports.updateProduct = (req, res) => {
    try {
         const { id } = req.params;
        const { name, price }= req.body;
        const product = products.find(p => p.id === Number(id));
        if (!product) {
        return res.status(404).json({ message:"Ürün bulunamadı."});
        }   
       if(name) product.name = name;
       if(price) product.price = price;

       return res.json({
        message: "Ürün başarıyla güncellendi",
        product
       });
    }catch (err) {
        console.error("Ürün güncelleme hatası:", err);
        return res.status(500).json({
            message:"Sunucu hatası"
        });
    }
    

};

exports.deleteProduct = (req, res) => {
    try {
        const{ id } = req.params;

        const index= products.findIndex(p=> p.id === Number(id));

        if(index === -1) {
            return res.status(404).json({
                message:"Ürün bulunamadı."
            });
        }
        const deletedProduct = products[index];
        products.splice(index,1);
        return res.json({
            message: "Ürün silme başarılı",
            deleted: deletedProduct
        });

    }catch (err){
        console.error("ürün silme hatası:", err);
        return res.status(500).json({message: "Sunucu hatası"});
    }
};