import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Drawer,
  ListItem,
  ListItemButton,
  Badge,
  Skeleton,
  Rating,
  TextField,
  Button,
  Container,
} from "@mui/material";
import {
  ShoppingCart,
  Menu as MenuIcon,
  Heart,
  Truck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { AddBox, AssignmentTurnedIn } from "@mui/icons-material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import CloseIcon from "@mui/icons-material/Close";
import Autocomplete from "@mui/material/Autocomplete";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Tooltip from "@mui/material/Tooltip";

const NextArrow = (props) => {
  const { onClick } = props;
  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: "absolute",
        top: "50%",
        right: -54,
        transform: "translateY(-50%)",
        zIndex: 2,
        bgcolor: "#fff",
        color: "#1976d2",
        boxShadow: 2,
        border: "1px solid #e0e0e0",
        "&:hover": { bgcolor: "#e3f2fd", color: "#115293" },
        width: 40,
        height: 40,
      }}
      aria-label="next"
    >
      <ArrowForwardIosIcon fontSize="small" />
    </IconButton>
  );
};

const PrevArrow = (props) => {
  const { onClick } = props;
  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: "absolute",
        top: "50%",
        left: -44,
        transform: "translateY(-50%)",
        zIndex: 2,
        bgcolor: "#fff",
        color: "#1976d2",
        boxShadow: 2,
        border: "1px solid #e0e0e0",
        "&:hover": { bgcolor: "#e3f2fd", color: "#115293" },
        width: 40,
        height: 40,
      }}
      aria-label="previous"
    >
      <ArrowBackIosNewIcon fontSize="small" />
    </IconButton>
  );
};

const Dashboard = () => {
  const [isOpen, setOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: "", email: "", role: "" });
  const [category, setCategory] = useState("All");
  const [wishlist, setWishlist] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [addProductForm, setAddProductForm] = useState({
    name: "",
    tagline: "",
    description: "",
    image: "",
    category: "",
    price: "",
  });
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("categories");
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [location, setLocation] = useState("");
  const [countries, setCountries] = useState([]);
  const [locationOpen, setLocationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");

  const handleClose = () => {
    setOpen(false);
  };
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const itemsPerPage = 12;
  const bannerImages = ["/banner1.jpg", "/banner2.jpg", "/banner3.jpg"];

  const fetchWishlistProducts = async (wishlistIds) => {
    if (!Array.isArray(wishlistIds) || wishlistIds.length === 0) {
      setWishlistProducts([]);
      setWishlistCount(0);
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:5000/products/by-ids?ids=${wishlistIds.join(",")}`
      );
      const data = await res.json();
      setWishlistProducts(Array.isArray(data) ? data : []);
      setWishlistCount(Array.isArray(data) ? data.length : 0);
    } catch {
      setWishlistProducts([]);
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "wishlist") {
        const updatedWishlist = JSON.parse(e.newValue) || [];
        setWishlist(updatedWishlist);
        fetchWishlistProducts(updatedWishlist);
      }
    };
    window.addEventListener("storage", handleStorage);

    const interval = setInterval(() => {
      const currentWishlist =
        JSON.parse(localStorage.getItem("wishlist")) || [];
      if (JSON.stringify(currentWishlist) !== JSON.stringify(wishlist)) {
        setWishlist(currentWishlist);
        fetchWishlistProducts(currentWishlist);
      }
    }, 1000);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [wishlist]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:5000/categories");
        const data = await res.json();
        setCategories(["Home", ...data]);
      } catch (err) {
        setCategories(["Home"]);
      }
    };
    fetchCategories();

    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) setUser(storedUser);
    const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
    setCartCount(cartItems.length);
    const storedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    setWishlist(storedWishlist);
    fetchWishlistProducts(storedWishlist);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (category !== "All") queryParams.append("category", category);
        if (currentSearchTerm.trim()) queryParams.append("search", currentSearchTerm.trim());
        const res = await fetch(
          `http://localhost:5000/products?${queryParams.toString()}`,
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error("Failed to fetch products.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category, currentSearchTerm]);

  useEffect(() => {
    fetch("https://countriesnow.space/api/v0.1/countries")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.data) {
          setCountries(data.data.map((c) => c.country));
        }
      })
      .catch(() => setCountries([]));
  }, []);

  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const updatedCart = [
      ...cart,
      { ...product, paymentMode: "To be selected during checkout" },
    ];
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setCartCount(updatedCart.length);
    toast.success(`${product.name} added to cart`);
    handleProductModalClose();
  };

  const toggleWishlist = async (productId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to manage your wishlist.");
      navigate("/login");
      return;
    }

    let updatedWishlist;
    if (wishlist.includes(productId)) {
      try {
        await fetch(`http://localhost:5000/wishlist/${productId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.info("Removed from wishlist");
        updatedWishlist = wishlist.filter((id) => id !== productId);
        setWishlist(updatedWishlist);
        localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
      } catch (err) {
        console.error("Failed to remove from wishlist:", err);
        toast.error("Failed to remove from wishlist");
      }
    } else {
      try {
        await fetch("http://localhost:5000/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        });
        toast.success("Added to wishlist");
        updatedWishlist = [...wishlist, productId];
        setWishlist(updatedWishlist);
        localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
      } catch (err) {
        console.error("Failed to add to wishlist:", err);
        toast.error("Failed to add to wishlist");
      }
    }
  };

  const handleCartClick = () => navigate("/cart");
  const handleUserMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleUserMenuClose = () => setAnchorEl(null);
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("cart");
    localStorage.removeItem("wishlist");
    setCartCount(0);
    setWishlistCount(0);
    toast.info("Logging out...");
    navigate("/login");
  };

  const handleAddProductChange = (e) => {
    setAddProductForm({ ...addProductForm, [e.target.name]: e.target.value });
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (
      !addProductForm.name ||
      !addProductForm.tagline ||
      !addProductForm.description ||
      !addProductForm.image ||
      !addProductForm.category ||
      !addProductForm.price
    ) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required to add products.");
        navigate("/login");
        return;
      }
      const res = await fetch("http://localhost:5000/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addProductForm),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.message || "Error occurred");
        return;
      }
      toast.success(result.message || "Product added!");
      setDrawerOpen(false);
      setAddProductForm({
        name: "",
        tagline: "",
        description: "",
        image: "",
        category: "",
        price: "",
      });
      setCategory(category);
    } catch (err) {
      console.error("Error adding product:", err);
      toast.error("Something went wrong");
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      toast.info("Category already exists");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required to add categories.");
        navigate("/login");
        return;
      }
      await fetch("http://localhost:5000/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: `Temp Category: ${trimmed}`,
          tagline: "Temp",
          description: "Temp category placeholder.",
          image: "",
          category: trimmed,
          price: 0,
        }),
      });
      setNewCategory("");
      toast.success("Category added! Reloading...");
      const res = await fetch("http://localhost:5000/categories");
      const data = await res.json();
      setCategories(["Home", ...data]);
    } catch (err) {
      console.error("Failed to add category:", err);
      toast.error("Failed to add category");
    }
  };

  const paginatedProducts = products.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const productSliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    swipeToSlide: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2, arrows: false } },
      { breakpoint: 480, settings: { slidesToShow: 1, arrows: false } },
    ],
  };

  const handleOrderNow = async (product) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to place an order.");
      navigate("/login");
      return;
    }

    try {
      const orderItem = {
        productId: product.id,
        name: product.name,
        image: product.image,
        qty: 1,
        price: product.price,
      };

      const response = await fetch("http://localhost:5000/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: [orderItem],
          total: product.price,
          shippedTo: user.name || user.email || "User",
          status: "Pending",
          orderDate: new Date().toLocaleDateString(),
          deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to place order.");
      }

      toast.success(`${product.name} ordered successfully!`);
      handleProductModalClose();
      navigate("/order");
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(error.message || "Could not place order.");
    }
  };

  const handleProductClick = (product) => {
    setExpandedProduct(product);
    setProductModalOpen(true);
  };

  const handleProductModalClose = () => {
    setProductModalOpen(false);
    setExpandedProduct(null);
  };

  function getCategoryImage(category) {
    const images = {
      Fashion: "/fashion.png",
      Electronics: "/electronics.png",
      Bags: "/bags.png",
      Footwear: "/footwear.png",
      Groceries: "/snack.png",
      Snack: "/snack.png",
      Utilities: "/utilities.png",
      Beauty: "/beauty.png",
      Wellness: "/wellness.png",
      Jewellery: "/jewellery.png",
    };
    return images[category] || "/categories/default.png";
  }

  return (
    <Box>
      <Box sx={{ bgcolor: "#f5f5f5", p: 1, textAlign: "center" }}>
        <Typography variant="body2">
          Get up to 50% off on every friday, limited time only
        </Typography>
      </Box>

      <AppBar
        position="static"
        sx={{ bgcolor: "white", color: "black", boxShadow: 2 }}
      >
        <Toolbar
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 1, sm: 3, md: 6 },
            minHeight: 72,
            gap: 2,
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 220 }}
          >
            <IconButton
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <img
              src="/newlogo.png"
              alt="logo"
              style={{ width: 70, marginRight: 8 }}
            />
            <Typography variant="h6" fontWeight="bold" sx={{ letterSpacing: 1, fontSize: 22 }}>
              NewIndia Shop
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flex: 1,
              maxWidth: 600,
              minWidth: 250,
              mx: 3,
            }}
          >
            <Box sx={{ position: "relative", minWidth: 180 }}>
              <TextField
                placeholder="Search for location..."
                label={
                  <span style={{ fontWeight: 500, color: "#666", letterSpacing: 0.2 }}>
                    Your Location
                  </span>
                }
                value={location}
                size="small"
                sx={{
                  width: 180,
                  background: "#fff",
                  borderRadius: 1,
                  cursor: "pointer",
                  "& .MuiOutlinedInput-root": {
                    fontWeight: 500,
                    color: "#222",
                    "& input": {
                      fontWeight: 500,
                      color: "#222",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1976d2",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1976d2",
                      boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.2)",
                    },
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: "#222",
                    opacity: 1,
                    fontWeight: 500,
                  },
                }}
                inputProps={{ readOnly: true, style: { fontWeight: 500, color: '#222' } }}
                InputProps={{
                  style: {
                    fontWeight: 500,
                    color: "#222",
                  },
                }}
                onClick={() => setLocationOpen((prev) => !prev)}
              />
              {locationOpen && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 44,
                    left: 0,
                    width: 320,
                    maxHeight: 340,
                    bgcolor: "#fff",
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    boxShadow: 4,
                    zIndex: 1302,
                    overflowY: "auto",
                    p: 0,
                  }}
                >
                  <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: "#1976d2", mb: 0.5 }}
                    >
                      Choose your Delivery Location
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", mb: 1 }}>
                      Enter your address and we will specify the offer for your
                      area.
                    </Typography>
                  </Box>
                  <Box sx={{ maxHeight: 260, overflowY: "auto", px: 2, pb: 2 }}>
                    {countries.map((country) => (
                      <Box
                        key={country}
                        sx={{
                          py: 1,
                          px: 1.5,
                          borderRadius: 1,
                          cursor: "pointer",
                          "&:hover": { bgcolor: "#e3f2fd" },
                          fontWeight: location === country ? 700 : 400,
                          color: location === country ? "#1976d2" : "inherit",
                          background: location === country ? "#e3f2fd" : "none",
                        }}
                        onClick={() => {
                          setLocation(country);
                          setLocationOpen(false);
                        }}
                      >
                        {country}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
            {/* Search Bar */}
            <TextField
              placeholder="Search for products..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                flex: 1,
                minWidth: 180,
                background: "#fff",
                borderRadius: 1,
                "& .MuiOutlinedInput-root": {
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2",
                    boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.2)",
                  },
                  "& input": {
                    fontWeight: 500,
                    color: "#222",
                  },
                },
                "& .MuiInputBase-input::placeholder": {
                  color: "#222",
                  opacity: 1,
                  fontWeight: 500,
                },
              }}
              InputProps={{
                style: {
                  fontWeight: 500,
                  color: "#222",
                },
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setCurrentSearchTerm(searchTerm);
                  setPage(1);
                }
              }}
            />
          </Box>

          <Box
            sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 220, justifyContent: 'flex-end' }}
          >
            <Tooltip title="Delivery" arrow>
              <IconButton sx={{ p: 1.2 }}>
                <Truck size={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Wishlist" arrow>
              <IconButton onClick={() => navigate("/wishlist")} sx={{ p: 1.2 }}>
                <Badge badgeContent={wishlistCount} color="error">
                  <Heart />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Cart" arrow>
              <IconButton onClick={handleCartClick} sx={{ p: 1.2 }}>
                <Badge badgeContent={cartCount} color="error">
                  <ShoppingCart />
                </Badge>
              </IconButton>
            </Tooltip>
            {user && user.email ? (
              <Box
                onClick={handleUserMenuClick}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  gap: 1,
                  ml: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  transition: "background 0.2s",
                  "&:hover": { background: "#f5f5f5" },
                }}
              >
                <Avatar
                  sx={{ width: 32, height: 32, bgcolor: "#1976d2", color: "#fff", fontWeight: 700 }}
                >
                  {user.name
                    ? user.name[0].toUpperCase()
                    : user.email[0].toUpperCase()}
                </Avatar>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", ml: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ lineHeight: 1.1 }}>
                    {user.name || user.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#1976d2",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    marginRight: 8,
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/login?register=true")}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#fff",
                    color: "#1976d2",
                    border: "1px solid #1976d2",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Register
                </button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleUserMenuClose}
        PaperProps={{ sx: { width: 220 } }}
      >
        {user && user.email ? (
          <>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography fontWeight="bold">
                {user.name || user.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
            <MenuItem
              onClick={() => {
                handleUserMenuClose();
                navigate("/account");
              }}
            >
              <span style={{ marginRight: 8 }}>👤</span> My Account
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleUserMenuClose();
                navigate("/address");
              }}
            >
              <span style={{ marginRight: 8 }}>📍</span> Address
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleUserMenuClose();
                navigate("/order");
              }}
            >
              <span style={{ marginRight: 8 }}>📦</span> Orders
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleUserMenuClose();
                navigate("/wishlist");
              }}
            >
              <span style={{ marginRight: 8 }}>❤️</span> My List
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleUserMenuClose();
                handleLogout();
              }}
            >
              <span style={{ marginRight: 8 }}>🚪</span> Logout
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem
              onClick={() => {
                handleUserMenuClose();
                navigate("/login");
              }}
            >
              <span style={{ marginRight: 8 }}>🔑</span> Login
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleUserMenuClose();
                navigate("/login?register=true");
              }}
            >
              <span style={{ marginRight: 8 }}>📝</span> Register
            </MenuItem>
          </>
        )}
      </Menu>

      <Drawer
        anchor="left"
        open={drawerOpen === true || drawerOpen === "categories"}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerTab("categories");
        }}
      >
        <Box sx={{ width: 280, p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <img src="/newlogo.png" alt="logo" style={{ width: 40 }} />
              <Typography variant="h6" fontWeight="bold">
                NewIndia Shop
              </Typography>
            </Box>
            <IconButton
              onClick={() => {
                setDrawerOpen(false);
                setDrawerTab("categories");
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Typography variant="subtitle1" fontWeight="bold" mb={1.5}>
            Shop By Categories
          </Typography>

          {drawerTab === "categories" && (
            <>
              {categories
                .filter((cat) => cat !== "Home")
                .map((cat) => (
                  <ListItem
                    key={cat}
                    disablePadding
                    sx={{
                      mb: 1,
                      borderRadius: 1,
                      "&:hover": { bgcolor: "#e3f2fd" },
                    }}
                  >
                    <ListItemButton
                      onClick={() => {
                        setCategory(cat);
                        setPage(1);
                        setDrawerOpen(false);
                        setDrawerTab("categories");
                      }}
                      sx={{
                        px: 2,
                        py: 1,
                        borderRadius: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        "&:hover": {
                          fontWeight: "bold",
                          transition: "all 0.3s",
                        },
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <AddBox sx={{ color: "#1976d2", fontSize: 18 }} />
                        <Typography variant="body1">{cat}</Typography>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                ))}

              {user && user.role === "superadmin" && (
                <ListItem sx={{ mt: 2 }}>
                  <ListItemButton
                    onClick={() => {
                      setDrawerOpen(false);
                      setTimeout(() => setOpen(true), 300);
                    }}
                    sx={{
                      bgcolor: "#1976d2",
                      color: "white",
                      fontWeight: "bold",
                      borderRadius: 1,
                      "&:hover": {
                        bgcolor: "#115293",
                      },
                    }}
                  >
                    + Add Product
                  </ListItemButton>
                </ListItem>
              )}
            </>
          )}
        </Box>
      </Drawer>

      <Box sx={{ borderBottom: "1px solid #ddd" }} />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 4,
          bgcolor: "white",
          py: 1.5,
          borderBottom: "1px solid #eee",
        }}
      >
        {categories.map((item) => (
          <Typography
            key={item}
            sx={{
              fontSize: "16px",
              fontWeight: 500,
              cursor: "pointer",
              position: "relative",
              "&:hover": { color: "#1976d2" },
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: -4,
                left: 0,
                width: "0%",
                height: "2px",
                bgcolor: "#1976d2",
                transition: "width 0.3s ease-in-out",
              },
              "&:hover::after": { width: "100%" },
            }}
            onClick={() => {
              if (item === "Home") {
                window.location.reload();
              } else {
                setCategory(item);
                setPage(1);
                setCurrentSearchTerm("");
                setSearchTerm("");
              }
            }}
          >
            {item}
          </Typography>
        ))}
      </Box>

      {/* Main Banner Slider - Reverted to original properties */}
      <Box sx={{ mt: 2, mb: 4 }}>
        <Slider
          dots
          infinite
          speed={800}
          slidesToShow={1}
          slidesToScroll={1}
          autoplay
          autoplaySpeed={4000}
        >
          {bannerImages.map((src, i) => (
            <Box key={i} sx={{ px: 2 }}>
              <img
                src={src}
                alt={`Banner ${i + 1}`}
                style={{
                  width: "100%",
                  height: "400px",
                //  objectFit: "cover",
                  borderRadius: "12px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                }}
              />
            </Box>
          ))}
        </Slider>
      </Box>

      <Box sx={{ px: { xs: 1, sm: 4, md: 8 }, py: 2, mt: 0 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, letterSpacing: 1, color: '#1976d2' }}>
          FEATURED CATEGORIES
        </Typography>
        <Box sx={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          {categories.filter(cat => cat !== 'Home').map((cat, idx) => (
            <Box
              key={cat}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 140,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.08)',
                },
              }}
              onClick={() => {
                setCategory(cat);
                setPage(1);
                setCurrentSearchTerm("");
                setSearchTerm("");
              }}
            >
              <Box
                sx={{
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  bgcolor: idx % 2 === 0 ? '#e3f2fd' : '#f8f6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1,
                  boxShadow: '0 4px 16px rgba(25,118,210,0.12)',
                  border: '2px solid #1976d2',
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                  '&:hover': {
                    boxShadow: '0 8px 32px rgba(25,118,210,0.18)',
                    borderColor: '#115293',
                  },
                }}
              >
                <img
                  src={getCategoryImage(cat)}
                  alt={cat}
                  style={{ width: 72, height: 72, objectFit: 'contain', transition: 'transform 0.2s' }}
                />
              </Box>
              <Typography
                variant="body1"
                fontWeight={600}
                sx={{
                  textAlign: 'center',
                  mt: 0.5,
                  color: '#222',
                  letterSpacing: 0.5,
                  transition: 'color 0.2s',
                  '&:hover': { color: '#1976d2' },
                }}
              >
                {cat}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ borderBottom: "1px solid #ddd", mb: 4 }} />
      <Box
        sx={{
          px: { xs: 1, sm: 4, md: 8 },
          py: 4,
          bgcolor: "#f7fafd",
          borderRadius: 3,
          boxShadow: "0 2px 12px rgba(25,118,210,0.04)",
          minHeight: 400,
          mb: 4,
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 3, color: "#222" }}
        >
          Products
        </Typography>
        {loading ? (
          <Box sx={{ display: "flex", gap: 2, overflowX: "auto" }}>
            {Array.from({ length: itemsPerPage }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width={250}
                height={240}
              />
            ))}
          </Box>
        ) : (
          <>
            {currentSearchTerm.trim() && products.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  😔 No products found for "{currentSearchTerm}".
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Try adjusting your search term or browsing other categories.
                </Typography>
                <Button variant="outlined" sx={{ mt: 3 }} onClick={() => {
                  setSearchTerm("");
                  setCurrentSearchTerm("");
                  setCategory("All");
                  setPage(1);
                }}>
                  Clear Search & View All Products
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                    md: "1fr 1fr 1fr",
                    lg: "1fr 1fr 1fr 1fr",
                  },
                  gap: 3,
                  justifyItems: "center",
                }}
              >
                {paginatedProducts.map((product) => (
                  <Card
                    key={product.id}
                    sx={{
                      width: 260,
                      minHeight: 340,
                      borderRadius: 2,
                      boxShadow: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      transition: "all 0.3s",
                      cursor: "pointer",
                      position: "relative",
                      bgcolor: "#fff",
                      "&:hover": {
                        transform: "scale(1.04)",
                        boxShadow: "0 8px 32px rgba(25,118,210,0.18)",
                      },
                    }}
                    onClick={() => handleProductClick(product)}
                  >
                    {/* Image with Enhanced Hover Effect */}
                    <CardMedia
                      component="img"
                      image={product.image}
                      alt={product.name}
                      sx={{
                        width: "100%",
                        height: 180,
                        objectFit: "contain",
                        borderRadius: 2,
                        mt: 1,
                        transition: "transform 0.3s ease-in-out, filter 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
                        "&:hover": {
                          transform: "scale(1.1)", // More zoom
                          filter: "brightness(1.1) contrast(1.1)", // More pop
                          boxShadow: "0 15px 45px rgba(0,0,0,0.3)", // Stronger, more lifted shadow
                        },
                      }}
                    />
                    <CardContent sx={{ width: "100%", textAlign: "center", p: 2 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{
                          transition: "color 0.2s",
                          "&:hover": { color: "#1976d2" },
                        }}
                      >
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {product.tagline}
                      </Typography>
                      <Typography variant="h6" color="green">
                        ₹{product.price || 1500}
                      </Typography>
                      <Rating value={4.3} precision={0.5} size="small" readOnly />
                    </CardContent>
                    {user && user.email && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          background: "rgba(255,255,255,0.92)",
                          borderRadius: 2,
                          boxShadow: 2,
                          p: 0.5,
                          alignItems: "center",
                          zIndex: 2,
                        }}
                      >
                        <Tooltip title="Add to Cart" arrow>
                          <IconButton
                            sx={{
                              bgcolor: "#1976d2",
                              color: "white",
                              mb: 1,
                              "&:hover": {
                                bgcolor: "#115293",
                                transform: "scale(1.15)",
                              },
                              p: 0.5,
                              transition: "all 0.2s",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                          >
                            <ShoppingCart size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={
                            wishlist.includes(product.id)
                              ? "Remove from Wishlist"
                              : "Add to Wishlist"
                          }
                          arrow
                        >
                          <IconButton
                            sx={{
                              bgcolor: "white",
                              color: wishlist.includes(product.id) ? "red" : "#555",
                              border: "1px solid #1976d2",
                              "&:hover": {
                                bgcolor: "#f5f5f5",
                                color: "#1976d2",
                                transform: "scale(1.15)",
                              },
                              p: 0.5,
                              transition: "all 0.2s",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(product.id);
                            }}
                          >
                            <Heart size={20} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Order Now" arrow>
                          <IconButton
                            sx={{
                              bgcolor: "#fff",
                              color: "#1976d2",
                              border: "1px solid #1976d2",
                              mt: 1,
                              "&:hover": {
                                bgcolor: "#e3f2fd",
                                color: "#115293",
                                transform: "scale(1.15)",
                              },
                              p: 0.5,
                              transition: "all 0.2s",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOrderNow(product);
                            }}
                          >
                            <AssignmentTurnedIn fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Card>
                ))}
              </Box>
            )}
          </>
        )}
      </Box>
      {/* Sleek divider for separation */}
      <Box
        sx={{
          width: "100%",
          height: 8,
          bgcolor: "transparent",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          mt: 0,
          mb: 0,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 4,
            bgcolor: "#1976d2",
            borderRadius: 2,
            opacity: 0.25,
          }}
        />
      </Box>

      {/* Banners under products - Original properties maintained */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
          mb: 4,
          mt: 2,
        }}
      >
        {/* banner4 and banner5 */}
        <Box
          sx={{
            width: "48%",
            height: 260,
            borderRadius: 0,
            overflow: "hidden",
            boxShadow: "0 2px 16px rgba(25,118,210,0.10)",
            border: "2px solid #e0e0e0",
            background: "#fff",
          }}
        >
          <Slider
            dots={false}
            arrows={false}
            autoplay
            autoplaySpeed={2000}
            infinite
            speed={700}
            slidesToShow={1}
            slidesToScroll={1}
          >
            <Box>
              <img
                src="/banner4.jpg"
                alt="Banner 4"
                style={{
                  width: "100%",
                  height: 260,
                  objectFit: "cover",
                  borderRadius: 0,
                }}
              />
            </Box>
            <Box>
              <img
                src="/banner5.jpg"
                alt="Banner 5"
                style={{
                  width: "100%",
                  height: 260,
                  objectFit: "cover",
                  borderRadius: 0,
                }}
              />
            </Box>
          </Slider>
        </Box>
        {/* banner6 and banner7 */}
        <Box
          sx={{
            width: "48%",
            height: 260,
            borderRadius: 0,
            overflow: "hidden",
            boxShadow: "0 2px 16px rgba(25,118,210,0.10)",
            border: "2px solid #e0e0e0",
            background: "#fff",
          }}
        >
          <Slider
            dots={false}
            arrows={false}
            autoplay
            autoplaySpeed={2000}
            infinite
            speed={700}
            slidesToShow={1}
            slidesToScroll={1}
          >
            <Box>
              <img
                src="/banner6.jpg"
                alt="Banner 6"
                style={{
                  width: "100%",
                  height: 260,
                  objectFit: "cover",
                  borderRadius: 0,
                }}
              />
            </Box>
            <Box>
              <img
                src="/banner7.jpg"
                alt="Banner 7"
                style={{
                  width: "100%",
                  height: 260,
                  objectFit: "cover",
                  borderRadius: 0,
                }}
              />
            </Box>
          </Slider>
        </Box>
      </Box>

      <ToastContainer position="top-right" autoClose={1000} />
      {/* Footer Section */}
      <Box
        sx={{
          bgcolor: "#f9f9f9",
          mt: 8,
          borderTop: "1px solid #ddd",
          pt: 6,
          pb: 4,
          px: { xs: 2, sm: 8 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            mb: 4,
          }}
        >
          <Box sx={{ textAlign: "center", flex: "1 1 150px", mb: 3 }}>
            <Truck size={32} color="#1976d2" style={{ marginBottom: 8 }} />
            <Typography
              fontWeight="bold"
              sx={{ "&:hover": { color: "#1976d2", cursor: "pointer" } }}
            >
              Free Shipping
            </Typography>
            <Typography variant="body2">For all Orders Over ₹1000</Typography>
          </Box>
          <Box sx={{ textAlign: "center", flex: "1 1 150px", mb: 3 }}>
            <Heart size={32} color="#1976d2" style={{ marginBottom: 8 }} />
            <Typography
              fontWeight="bold"
              sx={{ "&:hover": { color: "#1976d2", cursor: "pointer" } }}
            >
              30 Days Returns
            </Typography>
            <Typography variant="body2">For an Exchange Product</Typography>
          </Box>
          <Box sx={{ textAlign: "center", flex: "1 1 150px", mb: 3 }}>
            <ShoppingCart
              size={32}
              color="#1976d2"
              style={{ marginBottom: 8 }}
            />
            <Typography
              fontWeight="bold"
              sx={{ "&:hover": { color: "#1976d2", cursor: "pointer" } }}
            >
              Secured Payment
            </Typography>
            <Typography variant="body2">Payment Cards Accepted</Typography>
          </Box>
          <Box
            sx={{
              textAlign: "center",
              flex: "1 1 150px",
              mb: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Avatar
              sx={{
                bgcolor: "#1976d2",
                mb: 1,
                width: 48,
                height: 48,
                fontSize: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              🎁
            </Avatar>
            <Typography
              fontWeight="bold"
              sx={{ "&:hover": { color: "#1976d2", cursor: "pointer" } }}
            >
              Special Gifts
            </Typography>
            <Typography variant="body2">Our First Product Order</Typography>
          </Box>
          <Box
            sx={{
              textAlign: "center",
              flex: "1 1 150px",
              mb: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Avatar
              sx={{
                bgcolor: "#1976d2",
                mb: 1,
                width: 48,
                height: 48,
                fontSize: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              🎧
            </Avatar>
            <Typography
              fontWeight="bold"
              sx={{ "&:hover": { color: "#1976d2", cursor: "pointer" } }}
            >
              Support 24/7
            </Typography>
            <Typography variant="body2">Contact us Anytime</Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            borderTop: "1px solid #ddd",
            pt: 4,
          }}
        >
          <Box sx={{ flex: "1 1 200px", mb: 3 }}>
            <Typography fontWeight="bold" gutterBottom>
              Contact us
            </Typography>
            <Typography variant="body2">
              NewIndia Shop - Mega Super Store
            </Typography>
            <Typography variant="body2">507, Trade Center, India</Typography>
            <Typography variant="body2">support@newindiashop.in</Typography>
            <Typography variant="h6" color="error" fontWeight="bold" mt={1}>
              8690704684
            </Typography>
            <Typography sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              <span
                style={{ color: "#1976d2", fontSize: "1.2em", marginRight: 8 }}
              >
                💬
              </span>{" "}
              Online Chat
            </Typography>
          </Box>
          <Box sx={{ flex: "1 1 150px", mb: 3 }}>
            <Typography fontWeight="bold" gutterBottom>
              Products
            </Typography>
            {[
              "Prices drop",
              "New products",
              "Best sales",
              "Contact us",
              "Sitemap",
              "Stores",
            ].map((item) => (
              <Typography
                key={item}
                variant="body2"
                sx={{ "&:hover": { color: "#1976d2", cursor: "pointer" } }}
              >
                {item}
              </Typography>
            ))}
          </Box>
          <Box sx={{ flex: "1 1 150px", mb: 3 }}>
            <Typography fontWeight="bold" gutterBottom>
              Our Company
            </Typography>
            {[
              "Delivery",
              "Legal Notice",
              "Terms and conditions",
              "About us",
              "Secure payment",
              "Login",
            ].map((item) => (
              <Typography
                key={item}
                variant="body2"
                sx={{ "&:hover": { color: "#1976d2", cursor: "pointer" } }}
              >
                {item}
              </Typography>
            ))}
          </Box>
          <Box sx={{ flex: "1 1 250px", mb: 3 }}>
            <Typography fontWeight="bold" gutterBottom>
              Subscribe to Newsletter
            </Typography>
            <Typography variant="body2" gutterBottom>
              Get updates on latest deals and offers.
            </Typography>
            <TextField
              fullWidth
              placeholder="Your Email Address"
              size="small"
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <button
                style={{
                  backgroundColor: "#1976d2",
                  color: "white",
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                SUBSCRIBE
              </button>
              <input type="checkbox" />
              <Typography variant="caption">
                I agree to the terms and privacy policy
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            textAlign: "center",
            borderTop: "1px solid #ddd",
            pt: 2,
            fontSize: "13px",
          }}
        >
          © 2024 - NewIndia Shop. All rights reserved.
        </Box>
      </Box>

      {/* Product Expansion Modal */}
      <Dialog open={productModalOpen} onClose={handleProductModalClose} maxWidth="md" fullWidth>
        {expandedProduct && (
          <Box sx={{ p: { xs: 2, sm: 4 }, position: 'relative', minHeight: 420 }}>
            <IconButton
              aria-label="close"
              onClick={handleProductModalClose}
              sx={{
                position: 'absolute',
                right: 16,
                top: 16,
                zIndex: 2,
                background: '#fff',
                boxShadow: 1,
                borderRadius: 1,
                color: (theme) => theme.palette.grey[700],
                transition: 'color 0.2s, background 0.2s',
                '&:hover': {
                  background: '#f5f5f5',
                  color: 'red',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'center', justifyContent: 'center', mt: 2 }}>
              <Box sx={{ flex: '0 0 320px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f7fafd', borderRadius: 3, boxShadow: 2, p: 2 }}>
                <img
                  src={expandedProduct.image}
                  alt={expandedProduct.name}
                  style={{ width: 260, height: 260, objectFit: 'contain', borderRadius: 12, boxShadow: '0 4px 24px rgba(25,118,210,0.10)' }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 260 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, color: '#1976d2', letterSpacing: 1 }}>
                  {expandedProduct.name}
                </Typography>
                <Typography variant="subtitle1" sx={{ mb: 1, color: '#555', fontWeight: 500 }}>
                  {expandedProduct.tagline}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, color: '#333' }}>
                  {expandedProduct.description}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="h6" color="green" fontWeight="bold">
                    ₹{expandedProduct.price || 1500}
                  </Typography>
                  <Rating value={4.3} precision={0.5} size="large" readOnly sx={{ mt: 0.5 }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    sx={{ fontWeight: 600, px: 4, boxShadow: 2, borderRadius: 2, transition: 'background 0.2s', '&:hover': { background: '#115293' } }}
                    onClick={() => {
                      handleAddToCart(expandedProduct);
                      handleProductModalClose();
                    }}
                  >
                    Add to Cart
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="large"
                    sx={{ fontWeight: 600, px: 4, borderRadius: 2, transition: 'border-color 0.2s', '&:hover': { borderColor: '#115293' } }}
                    onClick={() => {
                      handleOrderNow(expandedProduct);
                      handleProductModalClose();
                    }}
                  >
                    Order Now
                  </Button>
                </Box>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Category: <span style={{ fontWeight: 600 }}>{expandedProduct.category}</span>
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Dialog>
      {/* Add Product Dialog */}
      <Dialog onClose={handleClose} open={isOpen}>
        <Box sx={{ p: 3, pt: 2, pb: 2, minWidth: 400, position: 'relative' }}>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              zIndex: 2,
              background: '#fff',
              boxShadow: 1,
              borderRadius: 1,
              color: (theme) => theme.palette.grey[700],
              transition: 'color 0.2s, background 0.2s',
              '&:hover': {
                background: '#f5f5f5',
                color: 'red',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="h6" fontWeight="bold" mb={2} sx={{ pr: 4 }}>
            Add New Product
          </Typography>
          <Box component="form" onSubmit={handleAddProductSubmit}>
            <TextField
              fullWidth
              label="Product Name"
              name="name"
              value={addProductForm.name}
              onChange={handleAddProductChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Tagline"
              name="tagline"
              value={addProductForm.tagline}
              onChange={handleAddProductChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={addProductForm.description}
              onChange={handleAddProductChange}
              multiline
              rows={3}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Image URL"
              name="image"
              value={addProductForm.image}
              onChange={handleAddProductChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Category"
              name="category"
              value={addProductForm.category}
              onChange={handleAddProductChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Price (₹)"
              name="price"
              type="number"
              value={addProductForm.price}
              onChange={handleAddProductChange}
              margin="normal"
              required
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
            >
              Add Product
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};
export default Dashboard;