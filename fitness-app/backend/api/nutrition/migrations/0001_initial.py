# Generated manually

from django.db import migrations, models
import django.db.models.deletion
import uuid

class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='FoodCategory',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True)),
            ],
            options={
                'verbose_name_plural': 'Food Categories',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='FoodItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200)),
                ('brand', models.CharField(blank=True, max_length=200)),
                ('serving_size', models.DecimalField(decimal_places=2, max_digits=8)),
                ('serving_unit', models.CharField(max_length=50)),
                ('calories', models.IntegerField()),
                ('protein', models.DecimalField(decimal_places=2, max_digits=8)),
                ('carbs', models.DecimalField(decimal_places=2, max_digits=8)),
                ('fat', models.DecimalField(decimal_places=2, max_digits=8)),
                ('fiber', models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ('sugar', models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ('sodium', models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ('is_verified', models.BooleanField(default=False)),
                ('is_custom', models.BooleanField(default=False)),
                ('created_by', models.CharField(blank=True, max_length=255, null=True)),
                ('barcode', models.CharField(blank=True, max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('category', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='food_items', to='nutrition.foodcategory')),
            ],
            options={
                'ordering': ['name'],
                'indexes': [models.Index(fields=['name'], name='nutrition_fo_name_e8a3d0_idx'), models.Index(fields=['barcode'], name='nutrition_fo_barcode_d66aad_idx')],
            },
        ),
        migrations.CreateModel(
            name='UserFoodItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('user_id', models.CharField(max_length=255)),
                ('is_favorite', models.BooleanField(default=False)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('food_item', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_foods', to='nutrition.fooditem')),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('user_id', 'food_item')},
            },
        ),
    ] 