import { mount } from '@vue/test-utils';
import SetItem from '@/components/SetItem.vue';
import { describe, it, expect } from 'vitest';

describe('SetItem.vue', () => {
  it('renders label correctly', () => {
    const label = 'Test Label';
    const wrapper = mount(SetItem, {
      props: { label }
    });
    expect(wrapper.find('.text').text()).toBe(label);
  });

  it('renders switch correctly', () => {
    const wrapper = mount(SetItem, {
      props: {
        label: 'Test Switch',
        modelValue: false
      }
    });
    const switchComp = wrapper.findComponent({ name: 'ElSwitch' });
    expect(switchComp.exists()).toBe(true);
  });

  it('emits update:modelValue when switch value changes', async () => {
    const wrapper = mount(SetItem, {
      props: {
        label: 'Test Switch',
        modelValue: false
      }
    });

    const switchComp = wrapper.findComponent({ name: 'ElSwitch' });
    // Simulate the event that el-switch would emit
    await switchComp.vm.$emit('update:modelValue', true);
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([true]);
  });
});
