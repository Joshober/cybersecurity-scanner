class User {
  final int? id;
  final String username;
  final String? email;
  final int? age;
  final String? weight;
  final String? height;
  final String? activityLevel;
  final bool? vegan;
  final bool? vegetarian;
  final String? dailyCalories;
  final String? carbohydratesG;
  final String? proteinsG;
  final String? fatsG;
  final String? boronMg;
  final String? calciumMg;
  final String? ironMg;
  final String? seleniumUg;
  final String? zincMg;
  final String? sodiumMg;

  User({
    this.id,
    required this.username,
    this.email,
    this.age,
    this.weight,
    this.height,
    this.activityLevel,
    this.vegan,
    this.vegetarian,
    this.dailyCalories,
    this.carbohydratesG,
    this.proteinsG,
    this.fatsG,
    this.boronMg,
    this.calciumMg,
    this.ironMg,
    this.seleniumUg,
    this.zincMg,
    this.sodiumMg,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      username: json['username'] ?? '', // Handle null username
      email: json['email'],
      age: json['age'],
      weight: json['weight'],
      height: json['height'],
      activityLevel: json['activityLevel'],
      vegan: json['vegan'],
      vegetarian: json['vegetarian'],
      dailyCalories: json['dailyCalories'],
      carbohydratesG: json['carbohydratesG'],
      proteinsG: json['proteinsG'],
      fatsG: json['fatsG'],
      boronMg: json['boronMg'],
      calciumMg: json['calciumMg'],
      ironMg: json['ironMg'],
      seleniumUg: json['seleniumUg'],
      zincMg: json['zincMg'],
      sodiumMg: json['sodiumMg'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'age': age,
      'weight': weight,
      'height': height,
      'activityLevel': activityLevel,
      'vegan': vegan,
      'vegetarian': vegetarian,
      'dailyCalories': dailyCalories,
      'carbohydratesG': carbohydratesG,
      'proteinsG': proteinsG,
      'fatsG': fatsG,
      'boronMg': boronMg,
      'calciumMg': calciumMg,
      'ironMg': ironMg,
      'seleniumUg': seleniumUg,
      'zincMg': zincMg,
      'sodiumMg': sodiumMg,
    };
  }

  User copyWith({
    int? id,
    String? username,
    String? email,
    int? age,
    String? weight,
    String? height,
    String? activityLevel,
    bool? vegan,
    bool? vegetarian,
    String? dailyCalories,
    String? carbohydratesG,
    String? proteinsG,
    String? fatsG,
    String? boronMg,
    String? calciumMg,
    String? ironMg,
    String? seleniumUg,
    String? zincMg,
    String? sodiumMg,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      age: age ?? this.age,
      weight: weight ?? this.weight,
      height: height ?? this.height,
      activityLevel: activityLevel ?? this.activityLevel,
      vegan: vegan ?? this.vegan,
      vegetarian: vegetarian ?? this.vegetarian,
      dailyCalories: dailyCalories ?? this.dailyCalories,
      carbohydratesG: carbohydratesG ?? this.carbohydratesG,
      proteinsG: proteinsG ?? this.proteinsG,
      fatsG: fatsG ?? this.fatsG,
      boronMg: boronMg ?? this.boronMg,
      calciumMg: calciumMg ?? this.calciumMg,
      ironMg: ironMg ?? this.ironMg,
      seleniumUg: seleniumUg ?? this.seleniumUg,
      zincMg: zincMg ?? this.zincMg,
      sodiumMg: sodiumMg ?? this.sodiumMg,
    );
  }
  
  /// Check if the user profile is complete
  /// A profile is considered complete if it has age, weight, height, and activity level
  bool get isProfileComplete {
    return age != null 
        && weight != null && weight!.isNotEmpty
        && height != null && height!.isNotEmpty
        && activityLevel != null && activityLevel!.isNotEmpty;
  }
}
